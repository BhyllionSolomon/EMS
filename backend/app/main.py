import os
from app.api.v1 import imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.base import Base
from app.core.database import engine, SessionLocal

from app.api.v1 import academic
from app.api.v1 import auth
from app.api.v1 import students
from app.api.v1 import departments
from app.api.v1 import programmes
from app.api.v1 import levels
from app.api.v1 import sessions
from app.api.v1 import assessments
from app.api.v1 import users
from app.api.v1 import audit

from app.models.user import User
from app.utils.security import hash_password


app = FastAPI(
    title="Computing Science Department KDU",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ems-frontend-fv32.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(programmes.router)
app.include_router(levels.router)
app.include_router(students.router)
app.include_router(academic.router)
app.include_router(sessions.router)
app.include_router(assessments.router)
app.include_router(users.router)
app.include_router(audit.router)


@app.on_event("startup")
def create_initial_admin():

    Base.metadata.create_all(bind=engine)

    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")

    if not username or not password:
        return

    db = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if existing_user:
            return

        admin = User(
            username=username,
            password_hash=hash_password(password),
            full_name="System Administrator",
            role="admin",
            is_active=True,
            is_deleted=False,
        )

        db.add(admin)
        db.commit()

    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "Educational Management System API is running"
    }
