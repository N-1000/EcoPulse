# Instrucciones de Seguridad (Security)

Este documento define las reglas estrictas de seguridad que el asistente de IA (Claude/Cursor) debe seguir en todo momento durante el desarrollo de Tangara 2026.

## Reglas Críticas de Seguridad

1. **Gestión de Secretos y API Keys**:
   - **NUNCA** escribas, sugieras, ni comitees API keys, tokens de acceso, contraseñas o secretos en el código fuente (archivos `.ts`, `.tsx`, `.js`, `.json`, `.md`).
   - Todos los secretos deben manejarse a través de variables de entorno usando el archivo `.env`.
   - Si creas una integración que requiera una clave (por ejemplo, OpenAI, Mapbox, Supabase), añade la variable al archivo `.env.example` con un valor ficticio (ej. `VITE_MAPBOX_TOKEN=your_token_here`).

2. **Evitar Inyecciones**:
   - Sanitiza siempre las entradas del usuario antes de procesarlas o renderizarlas en React para evitar vulnerabilidades XSS (Cross-Site Scripting). Aunque React escapa valores por defecto, ten cuidado con `dangerouslySetInnerHTML`.
   - Si en el futuro se conecta un backend, no construyas consultas SQL o NoSQL concatenando strings directamente.

3. **Dependencias Seguras**:
   - Antes de sugerir instalar un nuevo paquete de npm, asegúrate de que sea una biblioteca confiable, con mantenimiento activo y sin vulnerabilidades conocidas.

4. **Archivos Ignorados (.gitignore)**:
   - Verifica constantemente que cualquier archivo generado que contenga datos sensibles o configuraciones locales (como `.env`, `.env.local`, `node_modules/`, archivos de build) esté correctamente excluido en el `.gitignore`.

5. **Exposición de Datos**:
   - Como la aplicación es para una entidad gubernamental/ciudadana (Hackathon Cali), asegúrate de no exponer PII (Personal Identifiable Information) de usuarios en los logs de la consola ni en respuestas de red.

<thinking>
Antes de proponer o modificar código que maneje autenticación, tokens o datos de usuarios, el agente DEBE detenerse y revisar estas políticas de seguridad para garantizar que no se introduzcan vulnerabilidades.
</thinking>
