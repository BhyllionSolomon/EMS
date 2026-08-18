from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    StudentSignupRequest,
)
from app.schemas.user import UserCreate
from app.services.auth_service import authenticate_user
from app.services.user_service import (
    create_user,
    get_user_by_username,
)
from app.utils.security import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):

    user = authenticate_user(
        db,
        credentials.username,
        credentials.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(
        subject=str(user.id)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post(
    "/student-signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def student_signup(
    signup: StudentSignupRequest,
    db: Session = Depends(get_db),
):
    """
    Public, unauthenticated endpoint that lets a prospective student
    create their own login -- no admin has to set this account up
    first. Always creates a "student" role account; that can't be
    overridden by the caller. After signup they're immediately
    logged in (same response shape as /auth/login) so they can go
    straight to submitting their details.
    """

    existing_user = get_user_by_username(
        db,
        signup.username,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "That username is already taken. If this is your "
                "account, use Sign In instead."
            ),
        )

    user = create_user(
        db,
        UserCreate(
            username=signup.username,
            password=signup.password,
            full_name=signup.full_name,
            role="student",
        ),
    )

    token = create_access_token(subject=str(user.id))

    return {
        "access_token": token,
        "token_type": "bearer",
    }
