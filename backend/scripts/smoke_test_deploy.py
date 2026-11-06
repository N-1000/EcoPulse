#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ===================================================
# Smoke test manual post-deploy de EcoPulse backend.
#
# El deploy es manual (sin URL fija, sin Dockerfile/CI en el repo) -- este
# script corre aparte de la suite de pytest, contra un backend YA
# levantado, apuntando a la URL real que corresponda en ese momento.
#
# Uso:
#   python backend/scripts/smoke_test_deploy.py http://localhost:8000
#   # o: ECOPULSE_BASE_URL=https://lo-que-sea.com python backend/scripts/smoke_test_deploy.py
#
# Los 4 mensajes de chat no son genéricos -- cada uno verifica
# específicamente algo que cambió con el bump de pin de MuadDib a e45cd99
# (ver docs/comparacion-pin-muaddib.md): si el deploy real sigue en el pin
# viejo por error, ESTOS chequeos son los que lo detectan, no un health
# check genérico.
# ===================================================
import os
import sys

import httpx

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("ECOPULSE_BASE_URL", "http://localhost:8000")

_FALLOS: list[str] = []


def _check(nombre: str, condicion: bool, detalle: str = "") -> None:
    estado = "OK " if condicion else "FALLA"
    print(f"[{estado}] {nombre}" + (f" -- {detalle}" if detalle and not condicion else ""))
    if not condicion:
        _FALLOS.append(nombre)


def _post_chat(cliente: httpx.Client, mensaje: str) -> dict:
    r = cliente.post("/api/chat/", json={"message": mensaje, "current_page": "inicio"})
    r.raise_for_status()
    return r.json()


def main() -> int:
    print(f"Smoke test contra: {BASE_URL}\n")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as cliente:
        # 1. El proceso levantó y ClickHouse responde (o al menos no está caído el proceso).
        try:
            r = cliente.get("/health")
            _check("GET /health responde", r.status_code == 200, f"status={r.status_code}")
        except httpx.HTTPError as exc:
            _check("GET /health responde", False, str(exc))
            print("\nNo se pudo ni conectar -- se corta acá, el resto no tiene sentido.")
            return 1

        # 2. MuadDib inicializó (Nivel 0/1 activos). No se exige nivel2_configurado
        #    en ningún sentido particular -- solo que el campo exista (confirma que
        #    este backend corre el código post-bump, no una versión vieja sin el campo).
        r = cliente.get("/health/ready")
        body = r.json()
        _check("GET /health/ready -> ready=True", body.get("ready") is True, str(body))
        _check(
            "GET /health/ready incluye 'nivel2_configurado' (confirma código post-fix)",
            "nivel2_configurado" in body,
            str(body),
        )

        # 3. Camino feliz: el caso de uso más central del producto sigue respondiendo.
        data = _post_chat(cliente, "como esta el aire hoy")
        _check(
            "Pregunta básica de calidad del aire responde con un ICA real",
            "ica" in data["reply"].lower(),
            data["reply"],
        )

        # 4. El fix de región (aire_zona_03 del corpus): si el deploy real sigue en el
        #    pin viejo, acciones_sin_desagregacion queda vacío y esto falla.
        data = _post_chat(cliente, "cómo está el aire en Siloé")
        _check(
            "Mencionar una zona puntual (Siloé) aclara la limitación",
            "desagregado" in data["reply"].lower() or "zona puntual" in data["reply"].lower(),
            data["reply"],
        )

        # 5. El fix de sensor (sensor_02 del corpus): mismo mecanismo que el de región.
        data = _post_chat(cliente, "revisa el sensor de melendez")
        _check(
            "Mencionar un sensor puntual (melendez) aclara la limitación",
            "sensor puntual" in data["reply"].lower() or "por nombre" in data["reply"].lower(),
            data["reply"],
        )

        # 6. El fix de periodo (tendencia_03 del corpus): no depende del pin de MuadDib,
        #    pero es parte del mismo deploy -- se verifica igual.
        data = _post_chat(cliente, "¿cómo ha cambiado el aire en lo que va del año?")
        _check(
            "Tendencia anual usa periodo mensual, no el default 24h",
            "mensual" in data["reply"].lower() and "24 horas" not in data["reply"].lower(),
            data["reply"],
        )

    print()
    if _FALLOS:
        print(f"{len(_FALLOS)} chequeo(s) fallaron: {', '.join(_FALLOS)}")
        return 1
    print("Todo OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
