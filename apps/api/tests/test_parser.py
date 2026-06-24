from services.voice_dna.parser import parse_posts


def _make_post(n_words: int) -> str:
    return " ".join(["word"] * n_words)


def test_blank_line_separator():
    raw = f"{_make_post(40)}\n\n{_make_post(35)}"
    result = parse_posts(raw)
    assert len(result) == 2


def test_dash_separator():
    raw = f"{_make_post(40)}\n---\n{_make_post(35)}"
    result = parse_posts(raw)
    assert len(result) == 2


def test_rejects_short_posts():
    raw = f"{_make_post(40)}\n\n{_make_post(10)}\n\n{_make_post(50)}"
    result = parse_posts(raw)
    assert len(result) == 2
    for post in result:
        assert len(post.split()) >= 30


def test_strips_html():
    raw = f"<p>{_make_post(40)}</p>"
    result = parse_posts(raw)
    assert len(result) == 1
    assert "<p>" not in result[0]
    assert "</p>" not in result[0]


def test_50_posts():
    posts = [_make_post(50) for _ in range(50)]
    raw = "\n\n".join(posts)
    result = parse_posts(raw)
    assert len(result) == 50


def test_empty_input():
    assert parse_posts("") == []


def test_all_short_posts():
    raw = "\n\n".join([_make_post(5)] * 10)
    assert parse_posts(raw) == []
