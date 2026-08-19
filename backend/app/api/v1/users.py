from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependency import get_current_user
from app.core.role_dependency import require_admin

from app.schemas.user import (
    UserCreate,
    UserResponse,
)

from app.services.user_service import (
    create_user,
    delete_user,
    get_all_users,
    get_user,
    get_user_by_username,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/",
    response_model=list[UserResponse],
)
def read_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return get_all_users(db)


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing_user = get_user_by_username(
        db,
        user.username,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    try:
        return create_user(
            db,
            user,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get(
    "/me",
    response_model=UserResponse,
)
def read_me(
    current_user=Depends(get_current_user),
):
    return current_user


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def read_one(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = get_user(
        db,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = delete_user(
        db,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return None
