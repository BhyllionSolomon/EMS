from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.academic import ProgrammeCreate, ProgrammeResponse, ProgrammeUpdate
from app.services.programme_service import (
    create_programme,
    delete_programme,
    get_all_programmes,
    get_programme,
    update_programme,
)

router = APIRouter(
    prefix="/programmes",
    tags=["Programmes"],
)


@router.get("/", response_model=list[ProgrammeResponse])
def read_all_programmes(
    db: Session = Depends(get_db),
):
    return get_all_programmes(db)


@router.post(
    "/",
    response_model=ProgrammeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    programme: ProgrammeCreate,
    db: Session = Depends(get_db),
):
    return create_programme(db, programme)


@router.get(
    "/{programme_id}",
    response_model=ProgrammeResponse,
)
def read_one(
    programme_id: int,
    db: Session = Depends(get_db),
):
    programme = get_programme(db, programme_id)

    if not programme:
        raise HTTPException(
            status_code=404,
            detail="Programme not found",
        )

    return programme


@router.put(
    "/{programme_id}",
    response_model=ProgrammeResponse,
)
def update(
    programme_id: int,
    programme: ProgrammeUpdate,
    db: Session = Depends(get_db),
):
    updated_programme = update_programme(
        db,
        programme_id,
        programme,
    )

    if not updated_programme:
        raise HTTPException(
            status_code=404,
            detail="Programme not found",
        )

    return updated_programme


@router.delete(
    "/{programme_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    programme_id: int,
    db: Session = Depends(get_db),
):
    deleted_programme = delete_programme(
        db,
        programme_id,
    )

    if not deleted_programme:
        raise HTTPException(
            status_code=404,
            detail="Programme not found",
        )

    return None