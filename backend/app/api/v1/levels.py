from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.academic import LevelCreate, LevelResponse
from app.services.level_service import (
    create_level,
    delete_level,
    get_all_levels,
    get_level,
)

router = APIRouter(
    prefix="/levels",
    tags=["Levels"],
)


@router.get("/", response_model=list[LevelResponse])
def read_all_levels(
    db: Session = Depends(get_db),
):
    return get_all_levels(db)


@router.post(
    "/",
    response_model=LevelResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    level: LevelCreate,
    db: Session = Depends(get_db),
):
    return create_level(db, level)


@router.get(
    "/{level_id}",
    response_model=LevelResponse,
)
def read_one(
    level_id: int,
    db: Session = Depends(get_db),
):
    level = get_level(db, level_id)

    if not level:
        raise HTTPException(
            status_code=404,
            detail="Level not found",
        )

    return level


@router.delete(
    "/{level_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    level_id: int,
    db: Session = Depends(get_db),
):
    level = delete_level(db, level_id)

    if not level:
        raise HTTPException(
            status_code=404,
            detail="Level not found",
        )

    return None