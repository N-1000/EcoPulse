
from  typing import Any, Dict, List, Optional
from pydantic import BaseModel

class UIAction(BaseModel):
    type: str
    payload: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
    current_page: str = "inicio"


class ChatResponse(BaseModel):
    reply: str
    ai_actions: List[UIAction] = []