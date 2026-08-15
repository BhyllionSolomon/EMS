from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    file_name: str
    content_type: str | None = None
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True
