from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.academic import SessionCreate, SessionResponse
from app.services.session_service import (
    create_session,
    delete_session,
    get_all_sessions,
    get_session,
)

router = APIRouter(
    prefix="/sessions",
    tags=["Academic Sessions"],
)


@router.get("/", response_model=list[SessionResponse])
def read_all_sessions(
    db: Session = Depends(get_db),
):
    return get_all_sessions(db)


@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    session: SessionCreate,
    db: Session = Depends(get_db),
):
    return create_session(db, session)


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
)
def read_one(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = get_session(db, session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Academic session not found",
        )

    return session


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = delete_session(db, session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Academic session not found",
        )

    return None