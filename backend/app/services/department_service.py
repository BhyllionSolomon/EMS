from sqlalchemy.orm import Session

from app.models.academic import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def create_department(db: Session, department_data: DepartmentCreate):
    department = Department(
        **department_data.model_dump()
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


def get_departments(db: Session):
    return db.query(Department).all()


def get_department(db: Session, department_id: int):
    return (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )


def update_department(
    db: Session,
    department_id: int,
    department_data: DepartmentUpdate
):
    department = get_department(db, department_id)

    if department:
        for key, value in department_data.model_dump(
            exclude_unset=True
        ).items():
            setattr(department, key, value)

        db.commit()
        db.refresh(department)

    return department


def delete_department(db: Session, department_id: int):
    department = get_department(db, department_id)

    if department:
        db.delete(department)
        db.commit()

    return department