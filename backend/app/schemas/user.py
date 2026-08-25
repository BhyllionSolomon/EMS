from typing import Literal, Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: Literal[
        "admin",
        "assessor",
        "external_supervisor",
        "student",
        "siwes_coordinator",
    ] = "assessor"
    department_id: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    department_id: Optional[int] = None
    is_active: bool
    is_deleted: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
