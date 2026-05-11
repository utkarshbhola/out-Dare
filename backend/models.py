from pydantic import BaseModel
from typing import Optional, List

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    emoji: Optional[str] = '📍'
    location: Optional[str] = None
    time: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str
