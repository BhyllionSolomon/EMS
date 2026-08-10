from app import models
from app.core.database import engine
from app.models.base import Base


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    print("EMS database tables created successfully.")


if __name__ == "__main__":
    init_db()