from pydantic import BaseModel


class DepartmentBase(BaseModel):
    name: str
    code: str


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None


class DepartmentResponse(DepartmentBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True