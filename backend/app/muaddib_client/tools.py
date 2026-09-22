# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - muaddib_client/tools.py
#
# Registro de herramientas (Herramienta de intent_router.tools) que usan
# TANTO el despacho de Nivel 0/1 como el motor de Nivel 2 -- una sola
# fuente para los dos. El adaptador en routers/chat.py es el ÚNICO
# archivo de EcoPulse que importa tipos de intent_router (Decision,
# resolve, etc.); este módulo no sabe nada de Decision, solo recibe
# parámetros simples (región, período, página) y devuelve texto.
#
# Todas con efecto_real=False: EcoPulse es de solo lectura, no hay
# ninguna acción que modifique estado real -- validar_coherencia_
# sensitive_efecto no tiene nada que objetar acá porque los 4 intents
# sensitive:true (activar_alerta, etc.) declaran action:[] en
# canonical.yaml, no una acción real.
# ===================================================
from intent_router.tools import Herramienta

from app.services.clickhouse_nodes import obtener_nodos_actuales
from app.services.clickhouse_analytics import (
    get_24h_trends_clickhouse,
    get_monthly_historical_clickhouse,
    get_serie_por_sensor,
)
from app.services.news_service import fetch_live_cali_news
from app.services.routing import CALI_PARKS
from app.utils.ica import nivel_label_desde_ica
from app.utils.node_metrics import ica_promedio_ciudad, nodo_mejor_ica, nodo_peor_ica


# ──────────────────────────────────────────────────────────────
# Funciones -- factuales, sin personalidad. El tono/sabor de EcoPulse
# para Nivel 0/1 se agrega en el adaptador (routers/chat.py) a partir de
# respuestas.yaml; acá se devuelve el dato real tal cual, porque para
# Nivel 2 esto es lo que Claude lee como tool_result.
# ──────────────────────────────────────────────────────────────

def mostrar_calidad_aire() -> str:
    ica = ica_promedio_ciudad(obtener_nodos_actuales())
    return f"El ICA promedio de Cali ahora mismo es {ica} ({nivel_label_desde_ica(ica)})."


def mostrar_calidad_aire_region(region: str) -> str:
    # clickhouse_nodes.py no desagrega por comuna/barrio (hardcodeado a
    # "Cali") -- no se inventa un numero para `region`, se lo dice.
    return (
        f"Todavía no tengo el aire desagregado por zona, así que no puedo darte "
        f"el ICA específico de {region}. {mostrar_calidad_aire()}"
    )


def ubicar_sensor() -> str:
    activos = sum(1 for n in obtener_nodos_actuales() if n.get("status") == "activo")
    return f"Hay {activos} sensores activos en la red Tángara. No hay forma de ubicar uno puntual por nombre de barrio todavía."


def estado_sensores() -> str:
    nodos = obtener_nodos_actuales()
    total = len(nodos)
    activos = sum(1 for n in nodos if n.get("status") == "activo")
    inactivos = total - activos
    if inactivos == 0:
        return f"Los {total} sensores de la red están activos ahora mismo."
    return f"{activos} de {total} sensores están activos; {inactivos} inactivo(s)."


def consejo_actividad_salud() -> str:
    ica = ica_promedio_ciudad(obtener_nodos_actuales())
    if ica <= 50:
        recomendacion = "condiciones ideales para actividad al aire libre"
    elif ica <= 100:
        recomendacion = "se puede salir, pero con moderación si sos sensible"
    else:
        recomendacion = "mejor evitar actividad intensa al aire libre por ahora"
    return f"El ICA actual es {ica} ({nivel_label_desde_ica(ica)}): {recomendacion}."


def ayuda_metodologia() -> str:
    return (
        "El ICA (Índice de Calidad del Aire) resume la concentración de PM2.5 medida por la "
        "red Tángara: sensores IoT distribuidos por Cali. Se calcula con la fórmula EPA / "
        "Resolución 2254 del MinAmbiente, y los datos se guardan en tiempo real."
    )


def noticias_ambientales() -> str:
    noticias = fetch_live_cali_news()
    if not noticias:
        return "No hay noticias ambientales recientes de Cali en este momento."
    primero = noticias[0]
    return f"Hay {len(noticias)} noticias ambientales recientes. La más reciente: \"{primero['title']}\" ({primero['source']})."


def zonas_verdes() -> str:
    nombres = [p["name"] for p in CALI_PARKS[:5]]
    return f"Hay {len(CALI_PARKS)} parques y zonas verdes curadas en Cali, por ejemplo: {', '.join(nombres)}."


def tendencia_calidad_aire(periodo: str = "24h") -> str:
    if periodo == "mensual":
        datos = get_monthly_historical_clickhouse()
        medidos = [d for d in datos if d.get("ica") is not None]
        if not medidos:
            return "Todavía no hay datos mensuales medidos para este año."
        prom = round(sum(d["ica"] for d in medidos) / len(medidos))
        return f"El promedio mensual de ICA este año es {prom}, con {len(medidos)} meses medidos."
    datos = get_24h_trends_clickhouse("24h")
    valores = datos.get("green", [])
    if not valores:
        return "Todavía no hay datos suficientes de las últimas 24 horas."
    return f"El ICA de las últimas 24 horas fue de {min(valores)} a {max(valores)}; ahora mismo está en {valores[-1]}."


def serie_por_sensor() -> str:
    datos = get_serie_por_sensor()
    sensores = datos.get("sensors", [])
    if not sensores:
        return "Todavía no hay suficientes lecturas por sensor en las últimas 24 horas."
    return f"Hay serie de PM2.5 de las últimas 24 horas para {len(sensores)} sensores individuales."


def ranking_nodos() -> str:
    nodos = obtener_nodos_actuales()
    peor = nodo_peor_ica(nodos)
    if not peor:
        return "Ningún sensor está midiendo un ICA válido ahora mismo."
    mejor = nodo_mejor_ica(nodos)
    texto = f"El nodo con peor aire ahora mismo es {peor['id']}, con un ICA de {peor['measurements']['ica']}."
    if mejor and mejor["id"] != peor["id"]:
        texto += f" El de mejor aire es {mejor['id']}, con un ICA de {mejor['measurements']['ica']}."
    return texto


PAGINAS_VALIDAS = ("inicio", "mapa", "calidad-aire", "tendencias", "predicciones", "noticias", "sobre")


def navegar(pagina: str) -> str:
    if pagina not in PAGINAS_VALIDAS:
        return f"'{pagina}' no es una página válida de EcoPulse."
    return f"Navegación registrada hacia la página '{pagina}'."


def saludo() -> str:
    return "Saludo recibido."


# ──────────────────────────────────────────────────────────────
# Registro. name = accion declarada en rules_nivel0.yaml/canonical.yaml.
# ──────────────────────────────────────────────────────────────
HERRAMIENTAS: tuple[Herramienta, ...] = (
    Herramienta(
        name="show_air_quality",
        description="Da el ICA (Índice de Calidad del Aire) promedio real de Cali en este momento, medido por la red Tángara.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=mostrar_calidad_aire,
        efecto_real=False,
    ),
    Herramienta(
        name="show_quality_air",
        description=(
            "Da el ICA cuando el usuario pregunta por una región o barrio puntual de Cali (ej. Pance). "
            "EcoPulse no tiene el aire desagregado por región todavía, así que responde con el ICA "
            "general de la ciudad y lo aclara explícitamente."
        ),
        parametros={
            "type": "object",
            "properties": {"region": {"type": "string", "description": "Región o barrio mencionado por el usuario."}},
            "required": ["region"],
        },
        funcion=mostrar_calidad_aire_region,
        efecto_real=False,
    ),
    Herramienta(
        name="locate_sensor",
        description="Cuenta cuántos sensores de la red Tángara están activos ahora mismo. No puede ubicar un sensor puntual por nombre.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=ubicar_sensor,
        efecto_real=False,
    ),
    Herramienta(
        name="get_sensor_health",
        description="Da el conteo real de sensores activos e inactivos de la red Tángara ahora mismo.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=estado_sensores,
        efecto_real=False,
    ),
    Herramienta(
        name="get_health_activity_advice",
        description="Recomienda si es buen momento para actividad física al aire libre, según el ICA real actual de Cali.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=consejo_actividad_salud,
        efecto_real=False,
    ),
    Herramienta(
        name="show_help",
        description="Explica qué es el ICA y cómo lo calcula EcoPulse (metodología, no datos en vivo).",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=ayuda_metodologia,
        efecto_real=False,
    ),
    Herramienta(
        name="show_news",
        description="Da noticias ambientales reales y recientes de Cali.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=noticias_ambientales,
        efecto_real=False,
    ),
    Herramienta(
        name="show_green_zones",
        description="Lista parques y zonas verdes curadas de Cali.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=zonas_verdes,
        efecto_real=False,
    ),
    Herramienta(
        name="show_trend",
        description="Da la tendencia real de ICA de las últimas 24 horas, o el promedio mensual del año si periodo='mensual'.",
        parametros={
            "type": "object",
            "properties": {"periodo": {"type": "string", "enum": ["24h", "mensual"]}},
            "required": [],
        },
        funcion=tendencia_calidad_aire,
        efecto_real=False,
    ),
    Herramienta(
        name="show_sensor_series",
        description="Dice para cuántos sensores individuales hay serie temporal de PM2.5 de las últimas 24 horas.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=serie_por_sensor,
        efecto_real=False,
    ),
    Herramienta(
        name="show_node_ranking",
        description="Da el nodo con peor y con mejor calidad de aire ahora mismo en la red Tángara.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=ranking_nodos,
        efecto_real=False,
    ),
    Herramienta(
        name="navigate",
        description=(
            "Registra que se navegó a una página de la app EcoPulse. Sin efecto real, es solo de "
            "lectura -- no reemplaza dar la respuesta real al usuario, solo confirma la navegación."
        ),
        parametros={
            "type": "object",
            "properties": {"pagina": {"type": "string", "enum": list(PAGINAS_VALIDAS)}},
            "required": ["pagina"],
        },
        funcion=navegar,
        efecto_real=False,
    ),
    Herramienta(
        name="reply_greeting",
        description="Confirma que se recibió un saludo del usuario.",
        parametros={"type": "object", "properties": {}, "required": []},
        funcion=saludo,
        efecto_real=False,
    ),
)
