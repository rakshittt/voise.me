"""Content pillar clustering for Voise.

Groups a user's posts into topic clusters so that few-shot retrieval can
prefer examples from the same topic area as the input idea.

Uses spherical k-means (cosine distance) on OpenAI text-embedding-3-small
vectors, which are already unit-normalized.
"""
import bisect
import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)

_DEFAULT_K = 4
_MAX_ITER = 20
_MIN_POSTS_PER_CLUSTER = 3


@dataclass
class PillarResult:
    cluster_ids: list[int]         # one per post, same order as input embeddings
    k: int                         # number of clusters actually used
    cluster_counts: list[int]      # how many posts per cluster
    centroids: list[list[float]]   # unit-normalized centroid vector per cluster


def compute_pillars(
    embeddings: list[list[float]],
    k: int = _DEFAULT_K,
) -> PillarResult:
    """Cluster post embeddings into k topic pillars using spherical k-means.

    k is automatically reduced so that every cluster has at least
    _MIN_POSTS_PER_CLUSTER members.  Returns a PillarResult with per-post
    cluster assignments.
    """
    n = len(embeddings)
    if n == 0:
        return PillarResult(cluster_ids=[], k=0, cluster_counts=[], centroids=[])

    # Cap k so every cluster can have at least _MIN_POSTS_PER_CLUSTER posts
    k = max(1, min(k, n // _MIN_POSTS_PER_CLUSTER))

    X = np.array(embeddings, dtype=np.float32)  # (n, dim)

    # Normalize rows (embeddings should already be unit vectors, but be safe)
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    X = X / norms

    if k == 1:
        centroid = (X.mean(axis=0)).tolist()
        return PillarResult(cluster_ids=[0] * n, k=1, cluster_counts=[n], centroids=[centroid])

    # K-means++ initialization
    rng = np.random.default_rng(42)
    first_idx = rng.integers(n)
    centroids = [X[first_idx]]

    for _ in range(k - 1):
        C = np.array(centroids)  # (c, dim)
        sims = X @ C.T           # (n, c) - cosine similarity (unit vectors)
        max_sims = sims.max(axis=1)  # (n,) best similarity to any existing centroid
        distances = 1.0 - max_sims   # cosine distance
        distances = np.maximum(distances, 0)
        total = distances.sum()
        probs = distances / total if total > 0 else np.ones(n) / n
        chosen = rng.choice(n, p=probs)
        centroids.append(X[chosen])

    C = np.array(centroids, dtype=np.float32)  # (k, dim)
    cluster_ids = np.zeros(n, dtype=np.int32)

    for iteration in range(_MAX_ITER):
        sims = X @ C.T                       # (n, k)
        new_ids = np.argmax(sims, axis=1)    # (n,)

        if np.array_equal(new_ids, cluster_ids):
            logger.debug(f"Pillar k-means converged at iteration {iteration}")
            break

        cluster_ids = new_ids

        for j in range(k):
            members = X[cluster_ids == j]
            if len(members) == 0:
                # Dead cluster - reinitialize to the point furthest from all centroids
                all_sims = X @ C.T
                max_sims_all = all_sims.max(axis=1)
                C[j] = X[np.argmin(max_sims_all)]
            else:
                mean = members.mean(axis=0)
                norm = np.linalg.norm(mean)
                C[j] = mean / norm if norm > 0 else mean

    cluster_ids_list: list[int] = cluster_ids.tolist()
    cluster_counts = [int((cluster_ids == j).sum()) for j in range(k)]
    centroids_list: list[list[float]] = [C[j].tolist() for j in range(k)]

    logger.info(f"Pillar clustering: k={k}, counts={cluster_counts}")
    return PillarResult(
        cluster_ids=cluster_ids_list,
        k=k,
        cluster_counts=cluster_counts,
        centroids=centroids_list,
    )


def compute_loo_distribution(
    embeddings: list[list[float]],
    cluster_ids: list[int],
    centroids: list[list[float]],
) -> list[float]:
    """Compute per-post leave-one-out cosine similarity to its cluster centroid.

    Uses the fast update formula: C_minus_i = (N·C − v_i) / (N − 1).
    Returns a sorted list of similarities for percentile conversion during scoring.
    """
    if not embeddings or not centroids:
        return []

    X = np.array(embeddings, dtype=np.float64)
    C = np.array(centroids, dtype=np.float64)
    ids = np.array(cluster_ids, dtype=np.int32)

    # Ensure unit-normalised
    norms_x = np.linalg.norm(X, axis=1, keepdims=True)
    norms_x = np.where(norms_x == 0, 1.0, norms_x)
    X = X / norms_x

    norms_c = np.linalg.norm(C, axis=1, keepdims=True)
    norms_c = np.where(norms_c == 0, 1.0, norms_c)
    C = C / norms_c

    k = C.shape[0]
    cluster_sizes = np.array([(ids == j).sum() for j in range(k)], dtype=np.int32)

    similarities: list[float] = []
    for i in range(len(X)):
        j = int(ids[i])
        n_j = int(cluster_sizes[j])
        if n_j <= 1:
            similarities.append(1.0)
            continue
        c_minus_i = (n_j * C[j] - X[i]) / (n_j - 1)
        norm = np.linalg.norm(c_minus_i)
        if norm > 0:
            c_minus_i = c_minus_i / norm
        similarities.append(float(np.dot(X[i], c_minus_i)))

    return sorted(similarities)


def loo_percentile(similarity: float, loo_distribution: list[float]) -> float:
    """Convert a similarity score to its percentile within the LOO distribution.

    Returns a value in [0, 1]: 1.0 means the generated post is as close to the
    centroid as the top author post in the training corpus.
    """
    if not loo_distribution:
        return 0.5
    rank = bisect.bisect_left(loo_distribution, similarity)
    return rank / len(loo_distribution)
