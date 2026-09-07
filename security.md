# Instrucciones de Seguridad (Security)

Este documento define las reglas estrictas de seguridad que el asistente de IA debe seguir en todo momento durante el desarrollo.

## Reglas Críticas de Seguridad

1. **Gestión de Secretos y API Keys**:
   - **NUNCA** escribas, sugieras, ni comitees API keys, tokens de acceso, contraseñas o secretos en el código fuente (archivos `.ts`, `.tsx`, `.js`, `.json`, `.py`, `.md`).
   - Todos los secretos deben manejarse a través de variables de entorno usando el archivo `.env` / `backend/app/core/config.py`.
   - Si creas una integración que requiera una clave (por ejemplo, OpenAI, Mapbox, Supabase, Open-Meteo), añade la variable al archivo `.env.example` con un valor ficticio.

2. **Evitar Inyecciones**:
   - Sanitiza siempre las entradas del usuario antes de procesarlas o renderizarlas en React para evitar vulnerabilidades XSS (Cross-Site Scripting). Se prohíbe el uso irresponsable de `dangerouslySetInnerHTML`.
   - En las consultas SQL de ClickHouse (`clickhouse_analytics.py`, `clickhouse_nodes.py`), se deben usar parámetros parametrizados o escapado estricto sin concatenación insegura de entradas directas del usuario.

3. **Dependencias Seguras**:
   - Antes de sugerir instalar un nuevo paquete de npm o pip, asegúrate de que sea una biblioteca confiable, con mantenimiento activo y sin vulnerabilidades conocidas.

4. **Archivos Ignorados (.gitignore)**:
   - Verifica constantemente que cualquier archivo generado que contenga datos sensibles o configuraciones locales (como `.env`, `.env.local`, `node_modules/`, `backend/.venv`, archivos de build) esté correctamente excluido en el `.gitignore`.

5. **Exposición de Datos**:
   - Asegúrate de no exponer PII (Información Personal Identificable) de usuarios en los logs de la consola ni en respuestas de red.

6. **Integridad de Datos Ambientales**:
   - Se prohíbe alterar o falsear datos de los sensores en el cliente o servidor. Las lecturas deben ser consumidas y reportadas tal cual provienen de ClickHouse / sensores Tángara.

## Verificación Autónoma
Antes de proponer o modificar código que maneje tokens, peticiones HTTP o la integración con bases de datos, el agente debe validar que se cumplan estas 6 reglas.
