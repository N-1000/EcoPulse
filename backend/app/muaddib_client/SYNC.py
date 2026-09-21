# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - muaddib_client/SYNC.py
#
# Fuente única del commit de MuadDib del que se copiaron los 4 YAML de
# esta carpeta (canonical.yaml, config.yaml, entities.yaml,
# rules_nivel0.yaml). config_loader.py de MuadDib no empaqueta clients/
# en el wheel (correcto: la config de un cliente no es código de la
# librería) -- por eso EcoPulse mantiene su propia copia acá.
#
# PUNTO DÉBIL CONOCIDO, no resuelto: esto es sincronización manual. No
# hay ninguna validación automática de que estos YAML correspondan a la
# versión de intent_router instalada (requirements.txt) -- pyproject.toml
# de MuadDib no expone su commit de origen en tiempo de ejecución. Si se
# actualiza requirements.txt a un SHA nuevo, hay que volver a copiar los
# 4 YAML a mano y actualizar MUADDIB_SOURCE_COMMIT acá. Reportado a
# muaddib-c4 como candidato a arreglar del lado de MuadDib (ej. exponer
# intent_router.__source_commit__). Esto se va a repetir en cada cliente
# que dependa de MuadDib hasta que exista esa validación real.
#
# requirements.txt debe pinear al MISMO commit que este archivo declara
# -- si los tocás por separado, se desincronizan.
# ===================================================

MUADDIB_SOURCE_COMMIT = "ff608cec5bc0ed60fe40e691050202bb4d3f7c24"
MUADDIB_SOURCE_BRANCH = "dev"  # solo referencia humana, el pin real es el SHA
SYNCED_AT = "2026-09-20"
