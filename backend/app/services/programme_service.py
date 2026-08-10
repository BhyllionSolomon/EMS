from sqlalchemy.orm import Session

from app.models.academic import Programme
from app.schemas.academic import ProgrammeCreate, ProgrammeUpdate


def get_all_programmes(db: Session):
    return db.query(Programme).all()


def get_programme(db: Session, programme_id: int):
    return db.query(Programme).filter(
        Programme.id == programme_id
    ).first()


def create_programme(db: Session, programme_data: ProgrammeCreate):
    programme = Programme(
        **programme_data.model_dump()
    )

    db.add(programme)
    db.commit()
    db.refresh(programme)

    return programme


def update_programme(
    db: Session,
    programme_id: int,
    programme_data: ProgrammeUpdate,
):
    programme = get_programme(db, programme_id)

    if not programme:
        return None

    update_data = programme_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(programme, key, value)

    db.commit()
    db.refresh(programme)

    return programme


def delete_programme(db: Session, programme_id: int):
    programme = get_programme(db, programme_id)

    if not programme:
        return None

    db.delete(programme)
    db.commit()

    return programme