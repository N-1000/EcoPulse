# -*- coding: utf-8 -*-
# Lista mutable compartida entre test_chat_corpus.py (escribe, un dict por
# caso) y conftest.py (lee al final de la sesión para generar el reporte).
# Separado de corpus_chat.py a propósito: ese módulo son las PREDICCIONES
# escritas antes de correr nada; este es el resultado real, nunca se mezclan.
RESULTADOS: list[dict] = []
