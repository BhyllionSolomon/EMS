from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str


class DepartmentResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProgrammeCreate(BaseModel):
    name: str
    code: str
    department_id: int


class ProgrammeResponse(BaseModel):
    id: int
    name: str
    code: str
    department_id: int

    class Config:
        from_attributes = True


class ProgrammeUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    department_id: int | None = None

    class Config:
        from_attributes = True


class LevelCreate(BaseModel):
    name: str


class LevelResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    name: str


class SessionResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True