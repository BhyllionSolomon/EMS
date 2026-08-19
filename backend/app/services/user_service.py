from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password


def get_all_users(db: Session):
    return (
        db.query(User)
        .filter(User.is_deleted == False)
        .all()
    )


def get_user(
    db: Session,
    user_id: int,
):
    return (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_deleted == False,
        )
        .first()
    )


def get_user_by_username(
    db: Session,
    username: str,
):
    return (
        db.query(User)
        .filter(
            User.username == username,
            User.is_deleted == False,
        )
        .first()
    )


def create_user(
    db: Session,
    user_data: UserCreate,
):
    user = User(
        username=user_data.username,
        password_hash=hash_password(
            user_data.password
        ),
        full_name=user_data.full_name,
        role=user_data.role,
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        # Covers the case a pre-check can miss: a soft-deleted user
        # still permanently occupies their username at the database
        # level (get_user_by_username excludes deleted users, so it
        # can report a username as free when it isn't), plus any
        # genuine race between two concurrent signups/creations.
        db.rollback()

        raise ValueError(
            "That username is already taken."
        )

    db.refresh(user)

    return user


def delete_user(
    db: Session,
    user_id: int,
):
    user = get_user(
        db,
        user_id,
    )

    if not user:
        return None

    user.is_deleted = True

    db.commit()
    db.refresh(user)

    return user
