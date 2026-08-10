from sqlalchemy.orm import Session

from app.models.academic import Level
from app.schemas.academic import LevelCreate


def get_all_levels(db: Session):
    return db.query(Level).all()


def get_level(db: Session, level_id: int):
    return db.query(Level).filter(
        Level.id == level_id
    ).first()


def create_level(db: Session, level_data: LevelCreate):
    level = Level(
        **level_data.model_dump()
    )

    db.add(level)
    db.commit()
    db.refresh(level)

    return level


def delete_level(db: Session, level_id: int):
    level = get_level(db, level_id)

    if not level:
        return None

    db.delete(level)
    db.commit()

    return level