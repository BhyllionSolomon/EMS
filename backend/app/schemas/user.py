from typing import Literal

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: Literal["admin", "assessor"] = "assessor"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
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