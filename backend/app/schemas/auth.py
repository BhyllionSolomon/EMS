from pydantic import BaseModel, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StudentSignupRequest(BaseModel):
    # We recommend the student's matriculation number as the
    # username -- it's the identifier they already know, and it's
    # what ties their eventual submission to this same login. Role
    # is intentionally not a field here: signup can only ever create
    # a "student" account, enforced server-side.
    username: str
    password: str
    full_name: str

    @field_validator("username")
    @classmethod
    def username_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Username cannot be blank")
        return value

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError(
                "Password must be at least 6 characters"
            )
        return value

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be blank")
        return value
