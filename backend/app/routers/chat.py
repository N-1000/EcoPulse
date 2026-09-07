from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse, UIAction

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)


@router.post("/", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    user_msg = request.message.lower().strip()
    current_page = request.current_page

    # Reglas preliminares de prueba para validar la orquestación UI
    if "mapa" in user_msg or "ir al mapa" in user_msg:
        return ChatResponse(
            reply="¡Claro! Te dirijo al mapa interactivo de monitoreo de EcoPulse.",
            ai_actions=[
                UIAction(type="navigate", payload={"page": "mapa"})
            ]
        )

    if "calidad" in user_msg or "aire" in user_msg:
        return ChatResponse(
            reply=f"Actualmente estás en la vista '{current_page}'. Muestro los indicadores de calidad del aire.",
            ai_actions=[
                UIAction(type="show_quality_air", payload={"region": "Cali"})
            ]
        )

    # Respuesta por defecto
    return ChatResponse(
        reply=f"Recibí tu consulta desde la sección '{current_page}'. ¿En qué puedo ayudarte respecto a las alertas ambientales?",
        ai_actions=[]
    )