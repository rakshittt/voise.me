import uuid
from datetime import UTC, datetime, timedelta

from models.user import User
from services.usage_limits import maybe_extend_trial


def _user(trial_ends_at, created_at=None, trial_last_extended_date=None) -> User:
    user = User(
        id=uuid.uuid4(),
        clerk_user_id="clerk_test",
        plan="starter",
        trial_ends_at=trial_ends_at,
        trial_last_extended_date=trial_last_extended_date,
    )
    user.created_at = created_at or (datetime.now(UTC) - timedelta(days=1))
    return user


def test_extends_trial_by_one_day_on_first_generation_of_the_day():
    now = datetime.now(UTC)
    user = _user(trial_ends_at=now + timedelta(days=5), created_at=now - timedelta(days=10))

    extended = maybe_extend_trial(user)

    assert extended is True
    assert abs((user.trial_ends_at - (now + timedelta(days=6))).total_seconds()) < 2
    assert user.trial_last_extended_date == now.date()


def test_does_not_extend_twice_in_the_same_day():
    now = datetime.now(UTC)
    user = _user(
        trial_ends_at=now + timedelta(days=5),
        created_at=now - timedelta(days=10),
        trial_last_extended_date=now.date(),
    )

    extended = maybe_extend_trial(user)

    assert extended is False
    assert abs((user.trial_ends_at - (now + timedelta(days=5))).total_seconds()) < 2


def test_extension_capped_at_trial_max_days_from_signup():
    now = datetime.now(UTC)
    created = now - timedelta(days=29)
    # Already at the 30-day cap (created + 30d), one day shy of expiry
    user = _user(trial_ends_at=created + timedelta(days=30), created_at=created)

    extended = maybe_extend_trial(user)

    assert extended is False
    assert user.trial_ends_at == created + timedelta(days=30)
    # Still records today so repeat calls this day are cheap no-ops
    assert user.trial_last_extended_date == now.date()


def test_extension_clamped_to_cap_when_close_to_it():
    now = datetime.now(UTC)
    created = now - timedelta(days=29, hours=12)
    # Less than a full day remains before the 30-day cap
    user = _user(trial_ends_at=created + timedelta(days=29, hours=18), created_at=created)

    extended = maybe_extend_trial(user)

    assert extended is True
    assert user.trial_ends_at == created + timedelta(days=30)


def test_no_extension_when_not_in_trial():
    user = _user(trial_ends_at=None)

    assert maybe_extend_trial(user) is False
    assert user.trial_last_extended_date is None


def test_no_extension_when_trial_already_expired():
    now = datetime.now(UTC)
    user = _user(trial_ends_at=now - timedelta(days=1), created_at=now - timedelta(days=20))

    assert maybe_extend_trial(user) is False
    assert user.trial_last_extended_date is None
