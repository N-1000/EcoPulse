# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)


@router.post("/", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    # La clasificación de intención (qué pregunta el usuario, qué ai_actions
    # despachar) vive en el router de MuadDib, no acá. Este endpoint solo
    # mantiene el contrato ChatRequest -> ChatResponse para no romper el
    # frontend mientras se cablea la integración.
    return ChatResponse(
        reply="Recibí tu mensaje. El asistente de EcoPulse todavía se está conectando.",
        ai_actions=[]
    )