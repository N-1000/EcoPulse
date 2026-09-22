# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - loadtest/locustfile.py
#
# Corre contra loadtest.run_mocked_app (puerto 8001), nunca contra el
# backend real. Mezcla de tráfico pensada para parecerse al uso real:
# /api/nodes es lo más frecuente (cada pestaña abierta lo pollea cada
# 60s), el chat bastante menos, healthy-route ocasional.
#
# Nivel 0/1 vs Nivel 2 se miden por separado -- Locust agrupa por el
# parámetro `name`, no por URL, así que las dos categorías de /api/chat/
# aparecen como filas distintas en el reporte aunque pegan al mismo
# endpoint.
#
# Uso:
#   locust -f loadtest/locustfile.py --host http://127.0.0.1:8001
# ===================================================
import random

from locust import HttpUser, LoadTestShape, task, between

# Confirmados por pruebas manuales anteriores: resuelven en Nivel 0 o 1,
# sin escalar.
MENSAJES_NIVEL_0_1 = [
    "hola",
    "como esta el aire hoy",
    "gracias",
    "correr",
    "quiero ir a pance",
    "cual es el sensor mas contaminado ahora mismo",
    "voy a salir en bici",
    "que plan hay pa caminar",
]

# Confirmados por pruebas manuales anteriores: no matchean nada, escalan
# a Nivel 2 (typos, lugares sueltos, mensajes vagos).
MENSAJES_NIVEL_2 = [
    "calida del aire en el norte",
    "rios",
    "ingenio",
    "Boulevard del Rio",
    "que ha pasado en la tarde",
]


class UsuarioEcoPulse(HttpUser):
    wait_time = between(1, 3)

    @task(10)
    def ver_nodos(self):
        self.client.get("/api/nodes", name="/api/nodes")

    @task(4)
    def chat_nivel_0_1(self):
        msg = random.choice(MENSAJES_NIVEL_0_1)
        self.client.post(
            "/api/chat/",
            json={"message": msg, "current_page": "inicio"},
            name="/api/chat/ [nivel0-1]",
        )

    @task(2)
    def chat_nivel_2(self):
        msg = random.choice(MENSAJES_NIVEL_2)
        self.client.post(
            "/api/chat/",
            json={"message": msg, "current_page": "inicio"},
            name="/api/chat/ [nivel2]",
        )

    @task(1)
    def ruta_saludable(self):
        self.client.post(
            "/api/routing/healthy-route",
            json={"start": [3.45, -76.53], "end": [3.335, -76.54], "transport_mode": "walk"},
            name="/api/routing/healthy-route",
        )


class RampaHastaRomper(LoadTestShape):
    """Escalones: 1 -> 10 -> 25 -> 50 (checkpoint del criterio aprobado) ->
    75 -> 100 -> 150 -> 200 -> 300, 45s cada uno. No para sola -- el
    objetivo es correrla y leer en el reporte de Locust dónde empieza a
    romperse (error rate, p95) más allá de 50."""

    escalones = [
        (1, 1, 45),
        (10, 2, 45),
        (25, 5, 45),
        (50, 5, 45),
        (75, 5, 45),
        (100, 10, 45),
        (150, 10, 45),
        (200, 10, 45),
        (300, 15, 45),
    ]

    def tick(self):
        tiempo_corrido = self.get_run_time()
        acumulado = 0
        for usuarios, spawn_rate, duracion in self.escalones:
            acumulado += duracion
            if tiempo_corrido < acumulado:
                return (usuarios, spawn_rate)
        return None
