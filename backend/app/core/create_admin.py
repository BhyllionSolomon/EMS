from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password


def create_admin_user():
    db: Session = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.username == "lecturer1")
            .first()
        )

        if existing_user:
            print("User already exists.")
            return

        user = User(
            username="lecturer1",
            password_hash=hash_password("password123"),
            full_name="Project Assessment Lecturer",
            is_active=True,
            is_deleted=False,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print("Lecturer user created successfully.")
        print("Username: lecturer1")
        print("Password: password123")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()