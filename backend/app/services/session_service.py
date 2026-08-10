from sqlalchemy.orm import Session

from app.models.academic import AcademicSession
from app.schemas.academic import SessionCreate


def get_all_sessions(db: Session):
    return db.query(AcademicSession).all()


def get_session(db: Session, session_id: int):
    return db.query(AcademicSession).filter(
        AcademicSession.id == session_id
    ).first()


def create_session(db: Session, session_data: SessionCreate):
    session = AcademicSession(
        **session_data.model_dump()
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def delete_session(db: Session, session_id: int):
    session = get_session(db, session_id)

    if not session:
        return None

    db.delete(session)
    db.commit()

    return session