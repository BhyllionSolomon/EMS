from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
)
from app.services.department_service import (
    create_department,
    get_departments,
    get_department,
    update_department,
    delete_department,
)

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.post("/", response_model=DepartmentResponse)
def create(
    department: DepartmentCreate,
    db: Session = Depends(get_db)
):
    return create_department(db, department)


@router.get("/", response_model=list[DepartmentResponse])
def read_all(
    db: Session = Depends(get_db)
):
    return get_departments(db)


@router.get("/{department_id}", response_model=DepartmentResponse)
def read_one(
    department_id: int,
    db: Session = Depends(get_db)
):
    department = get_department(db, department_id)

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return department


@router.put("/{department_id}", response_model=DepartmentResponse)
def update(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db)
):
    department = update_department(
        db,
        department_id,
        department_data
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return department


@router.delete("/{department_id}")
def delete(
    department_id: int,
    db: Session = Depends(get_db)
):
    department = delete_department(db, department_id)

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return {
        "message": "Department deleted successfully"
    }