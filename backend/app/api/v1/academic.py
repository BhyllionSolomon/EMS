from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import (
    Department,
    Programme,
    Level,
    AcademicSession,
)
from app.schemas.academic import (
    DepartmentCreate,
    DepartmentResponse,
    ProgrammeCreate,
    ProgrammeResponse,
    LevelCreate,
    LevelResponse,
    SessionCreate,
    SessionResponse,
)


router = APIRouter(
    prefix="/academic",
    tags=["Academic Structure"]
)


# Departments

@router.post(
    "/departments",
    response_model=DepartmentResponse
)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db)
):
    department = Department(
        name=data.name
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


@router.get(
    "/departments",
    response_model=list[DepartmentResponse]
)
def get_departments(
    db: Session = Depends(get_db)
):
    return db.query(Department).all()


# Programmes

@router.post(
    "/programmes",
    response_model=ProgrammeResponse
)
def create_programme(
    data: ProgrammeCreate,
    db: Session = Depends(get_db)
):
    programme = Programme(
        name=data.name,
        department_id=data.department_id
    )

    db.add(programme)
    db.commit()
    db.refresh(programme)

    return programme


@router.get(
    "/programmes",
    response_model=list[ProgrammeResponse]
)
def get_programmes(
    db: Session = Depends(get_db)
):
    return db.query(Programme).all()


# Levels

@router.post(
    "/levels",
    response_model=LevelResponse
)
def create_level(
    data: LevelCreate,
    db: Session = Depends(get_db)
):
    level = Level(
        name=data.name
    )

    db.add(level)
    db.commit()
    db.refresh(level)

    return level


@router.get(
    "/levels",
    response_model=list[LevelResponse]
)
def get_levels(
    db: Session = Depends(get_db)
):
    return db.query(Level).all()


# Sessions

@router.post(
    "/sessions",
    response_model=SessionResponse
)
def create_session(
    data: SessionCreate,
    db: Session = Depends(get_db)
):
    session = AcademicSession(
        name=data.name
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get(
    "/sessions",
    response_model=list[SessionResponse]
)
def get_sessions(
    db: Session = Depends(get_db)
):
    return db.query(AcademicSession).all()