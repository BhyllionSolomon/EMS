from fastapi import FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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

app = FastAPI(
    title="Educational Management System",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
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


@app.get("/")
def root():
    return {
        "message": "Educational Management System API is running"
    }