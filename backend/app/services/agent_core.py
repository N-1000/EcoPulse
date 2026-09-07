import asyncio
import random
from typing import Optional, Dict, Any, List
from app.models.chat import ChatRequest, ChatResponse, UIAction


# ==============================================================================
# SERVICIOS DE DATOS (Conectados con tu frontend: useNodes, fetchForecast, etc.)
# ==============================================================================

class NodeDataService:

    @staticmethod
    async def get_all_nodes() -> List[Dict[str, Any]]:
        return [
            {"id": "node-pance", "name": "Nodo Pance - Río", "region": "pance", "aqi": 22, "pm25": 5.4, "status": "Excelente", "barrio": "Pance"},
            {"id": "node-univalle", "name": "Nodo Univalle", "region": "sur", "aqi": 45, "pm25": 11.0, "status": "Buena", "barrio": "Ciudad Jardín"},
            {"id": "node-centro", "name": "Nodo Centro - CAM", "region": "centro", "aqi": 115, "pm25": 41.2, "status": "Dañina a Grupos Sensibles", "barrio": "San Pedro"},
            {"id": "node-menga", "name": "Nodo Industrial Menga", "region": "norte", "aqi": 142, "pm25": 52.8, "status": "Dañina a la Salud", "barrio": "Menga"},
            {"id": "node-farallones", "name": "Nodo Cristo Rey", "region": "occidente", "aqi": 18, "pm25": 4.1, "status": "Excelente", "barrio": "Los Cristales"}
        ]

    @staticmethod
    async def get_worst_node() -> Dict[str, Any]:
        nodes = await NodeDataService.get_all_nodes()
        return max(nodes, key=lambda x: x["aqi"])

    @staticmethod
    async def get_node_by_region(region_name: str) -> Optional[Dict[str, Any]]:
        nodes = await NodeDataService.get_all_nodes()
        for node in nodes:
            if node["region"] == region_name or region_name in node["name"].lower():
                return node
        return None


class ForecastService:
    
    @staticmethod
    async def get_24h_forecast() -> Dict[str, Any]:
        return {
            "avg_aqi": 58,
            "status": "Moderada",
            "peak_hour": "07:30 AM",
            "recommendation": "Los vientos del Pacífico mejorarán la dispersión en la tarde."
        }


# ==============================================================================
# AGENTE PRINCIPAL ECOPULSE
# ==============================================================================

class EcoPulseAgent:

    PLANS_DATA = {
        "pance": [
            "¡Uff, Pance es una verraquera, ciudadano! Consulta el sensor más cercano en el mapa para ver el ICA en tiempo real antes de salir. El río está bueno pa' refrescarse, eso sí.",
            "¡Mirá ve, qué plan tan chuzón! Revisa el semáforo del nodo Pance en el mapa. Si está verde, ¡vamos! Y no olvides cuidar el río.",
        ],
        "caminata": [
            "¡Qué calidoso ese plan! Antes de salir, revisa el ICA de tu zona en el mapa EcoPulse. La madrugada o el tardecito (después de las 4pm) suelen ser los mejores horarios. ¡Lleva agua, parcero!",
            "¡Sí señor, a caminar se dijo! Usa la Ruta Saludable del mapa para evitar zonas de alto tráfico. Los cerros tutelares tienen el aire más fresco de la ciudad.",
        ],
        "bici": [
            "¡Ay, parcero, en bici por Cali es una chimba! Activa la modalidad 'Bicicleta' en la Ruta Saludable del mapa para encontrar el camino con mejor calidad del aire. ¡Y casco, que eso es ley!",
            "¡Ruta en bici, qué bello plan, causita! Consulta el mapa para ver qué nodos están en verde hoy. Sal tempranito antes de las 7am.",
        ],
        "borondo": [
            "¡Eso es lo que necesitaba escuchar, el borondo! Revisa el semáforo del mapa para los barrios del plan: San Antonio, La Loma de la Cruz, Granada. Si están en verde, ¡vamos que Cali es verraca!",
            "¡Viva Cali! Antes del borondo, chequea el ICA en el mapa. Empieza en el Museo La Tertulia, sube a Cristo Rey y termina donde el cuerpo aguante.",
        ],
    }

    GENERIC_RESPONSES = [
        "¡Hola, ciudadano! Revisa el mapa EcoPulse para ver la calidad del aire en tiempo real en tu zona.",
        "¡Claro que sí, parcero! Consulta el semáforo ICA en el mapa para planear tu actividad de forma segura.",
        "¡Mirá ve! La red EcoPulse tiene datos en tiempo real del aire de Cali. ¿En qué te puedo ayudar?",
        "¡Qué nota, ciudadano! EcoPulse AI está aquí para ayudarte a explorar Cali de forma inteligente y ecológica.",
    ]

    async def process(self, request: ChatRequest) -> ChatResponse:
        await asyncio.sleep(0.4)

        user_msg = request.message.lower().strip()
        current_page = request.current_page

        # ----------------------------------------------------
        # 1. Preguntas Sugeridas Específicas
        # ----------------------------------------------------
        if "nodo con mayor contaminación" in user_msg or "más contaminado" in user_msg:
            worst = await NodeDataService.get_worst_node()
            return ChatResponse(
                reply=f"El nodo con mayor contaminación ahora mismo es **{worst['name']}** ({worst['barrio']}) con un ICA de **{worst['aqi']} ({worst['status']})**. Te enfoco el nodo en el mapa.",
                ai_actions=[
                    UIAction(type="navigate", payload={"page": "mapa"}),
                    UIAction(type="focus_node", payload={"node_id": worst["id"]})
                ],
            )

        if "calidad del aire mañana" in user_msg or "pronostico" in user_msg or "prediccion" in user_msg:
            forecast = await ForecastService.get_24h_forecast()
            return ChatResponse(
                reply=f"El modelo predictivo de EcoPulse estima un ICA promedio de **{forecast['avg_aqi']} ({forecast['status']})** para mañana. Pico esperado a las **{forecast['peak_hour']}**. Te llevo a Tendencias.",
                ai_actions=[UIAction(type="navigate", payload={"page": "tendencias"})],
            )

        if "ruta es más saludable" in user_msg or "correr" in user_msg:
            return ChatResponse(
                reply="¡La Ruta Saludable es mi especialidad! Abriré el mapa para que traces el camino con menor ICA desde tu ubicación.",
                ai_actions=[
                    UIAction(type="navigate", payload={"page": "mapa"}),
                    UIAction(type="enable_tool", payload={"tool": "healthy_route"})
                ],
            )

        if "comunas" in user_msg and "limpio" in user_msg:
            return ChatResponse(
                reply=f"Históricamente, las comunas del sur (Pance, Ciudad Jardín) y el occidente tienen menor concentración de PM2.5. Actualmente estás en la vista '{current_page}'.",
                ai_actions=[UIAction(type="show_quality_air", payload={"region": "sur"})],
            )

        # ----------------------------------------------------
        # 2. Planes Rápidos (Borondos / Accesos directos)
        # ----------------------------------------------------
        if "pance" in user_msg:
            pance_node = await NodeDataService.get_node_by_region("pance")
            base_text = random.choice(self.PLANS_DATA["pance"])
            if pance_node:
                reply_text = f"{base_text} Acto seguido: El nodo {pance_node['name']} registra un ICA actual de {pance_node['aqi']} ({pance_node['status']})."
            else:
                reply_text = base_text

            return ChatResponse(
                reply=reply_text,
                ai_actions=[UIAction(type="show_quality_air", payload={"region": "pance"})],
            )

        if any(k in user_msg for k in ["caminata", "caminar", "senderismo"]):
            return ChatResponse(
                reply=random.choice(self.PLANS_DATA["caminata"]),
                ai_actions=[UIAction(type="navigate", payload={"page": "mapa"})],
            )

        if "bici" in user_msg or "bicicleta" in user_msg:
            return ChatResponse(
                reply=random.choice(self.PLANS_DATA["bici"]),
                ai_actions=[UIAction(type="navigate", payload={"page": "mapa"})],
            )

        if any(k in user_msg for k in ["borondo", "turistico", "tour"]):
            return ChatResponse(
                reply=random.choice(self.PLANS_DATA["borondo"]),
                ai_actions=[UIAction(type="navigate", payload={"page": "mapa"})],
            )

        # ----------------------------------------------------
        # 3. Navegación por Comandos Directos de Texto
        # ----------------------------------------------------
        if any(k in user_msg for k in ["mapa", "nodos", "ubicacion", "donde"]):
            return ChatResponse(
                reply="¡De una! Te dirijo al mapa interactivo de monitoreo ambiental.",
                ai_actions=[UIAction(type="navigate", payload={"page": "mapa"})],
            )

        if any(k in user_msg for k in ["inicio", "home", "principal"]):
            return ChatResponse(
                reply="Volviendo a la pantalla principal de EcoPulse.",
                ai_actions=[UIAction(type="navigate", payload={"page": "inicio"})],
            )

        # ----------------------------------------------------
        # 4. Respuesta por Defecto
        # ----------------------------------------------------
        return ChatResponse(
            reply=random.choice(self.GENERIC_RESPONSES),
            ai_actions=[],
        )
        
agent = EcoPulseAgent()