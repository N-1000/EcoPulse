# -*- coding: utf-8 -*-
# ===================================================
# Hallazgo de severidad alta (reporte interno del corpus de chat, no publicado): aire_zona_02,
# aire_zona_03, sensor_02 y tendencia_03 resolvieron sin escalar pero
# estaban mal -- ignoraron una zona/sensor mencionado sin avisar, o usaron
# el periodo por default en vez del que el mensaje pedía. Regla genérica
# (config.yaml::acciones_sin_desagregacion + entities.yaml), no un if por
# caso en chat.py.
# ===================================================


def test_region_mencionada_se_aclara_en_consultar_calidad_aire(client):
    """aire_zona_03 del corpus: 'Siloé' se ignoraba sin avisar."""
    response = client.post("/api/chat/", json={"message": "cómo está el aire en Siloé"})
    reply = response.json()["reply"]
    assert "desagregado" in reply.lower() or "zona" in reply.lower()


def test_sensor_mencionado_se_aclara_en_consultar_estado_sensor(client):
    """sensor_02 del corpus: 'melendez' se ignoraba sin avisar -- y el tipo de entidad
    'sensor' ni existía en el catálogo."""
    response = client.post("/api/chat/", json={"message": "revisa el sensor de melendez"})
    reply = response.json()["reply"]
    assert "sensor puntual" in reply.lower() or "por nombre" in reply.lower()


def test_sin_zona_ni_sensor_mencionado_no_agrega_aclaracion_de_mas(client):
    """No sobre-aplicar la regla: una pregunta genérica no necesita aclaración."""
    response = client.post("/api/chat/", json={"message": "como esta el aire hoy"})
    reply = response.json()["reply"]
    assert "desagregado" not in reply.lower()
    assert "sensor puntual" not in reply.lower()


def test_periodo_anual_se_detecta_como_mensual_no_default_24h(client):
    """tendencia_03 del corpus: 'en lo que va del año' no matcheaba ninguna keyword de
    periodo y caía en el default 24h en vez de mensual."""
    response = client.post("/api/chat/", json={"message": "¿cómo ha cambiado el aire en lo que va del año?"})
    reply = response.json()["reply"]
    assert "mensual" in reply.lower()
    assert "24 horas" not in reply.lower()
