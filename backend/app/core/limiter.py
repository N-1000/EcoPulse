# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - core/limiter.py
#
# Instancia única de Limiter (slowapi), en su propio módulo para que
# main.py Y los routers la importen sin import circular (main.py importa
# los routers, así que el Limiter no puede vivir ahí).
#
# get_remote_address() (no get_ipaddr()) a propósito: get_ipaddr() confía
# directo en el header X-Forwarded-For que manda el cliente, sin validar
# contra ningún proxy de confianza -- cualquiera lo spoofea y esquiva el
# límite mandando un IP distinto en cada request. get_remote_address() lee
# request.client.host, que es el peer TCP real SALVO que uvicorn ya lo haya
# corregido con su propio ProxyHeadersMiddleware.
#
# Si esto se despliega detrás de un proxy reverso o CDN, uvicorn tiene que
# arrancar con --proxy-headers --forwarded-allow-ips=<IP del proxy> (nunca
# "*") -- si no, request.client.host va a ser la IP del proxy para TODOS
# los usuarios, y el rate limiting va a tratarlos a todos como uno solo.
# Verificar esto en el entorno real antes de deployar; no se puede resolver
# desde acá porque depende de la infraestructura, no del código.
# ===================================================
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
