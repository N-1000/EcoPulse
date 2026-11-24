# ===================================================
# ECOPULSE 2026 - Configuración central del backend
# Carga las variables de entorno desde .env de forma tipada.
# ===================================================
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación leída desde variables de entorno / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- ClickHouse (infra de Tangara) ---
    clickhouse_host: str = "localhost"
    clickhouse_port: int = 8443
    clickhouse_user: str = "default"
    clickhouse_password: str = ""
    clickhouse_database: str = "tangara_plata"
    clickhouse_database_gold: str = "tangara_oro"
    clickhouse_secure: bool = True

    # --- App ---
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Usado por obtener_nodos_actuales() (clickhouse_nodes.py) para cachear
    # /api/nodes. Default a mitad del rango pedido (30-60s): el dato real
    # cambia por minuto, así que cachear más de 60s serviría un dato viejo,
    # y menos de 30s no reduce la carga sobre ClickHouse de forma notable.
    cache_ttl_seconds: int = 45

    # Minutos sin lecturas tras los cuales un nodo pasa a "inactivo".
    # Los sensores reportan cada ~30-60s; 30 min tolera cortes cortos de red
    # sin marcar como activo a un nodo que lleva horas mudo.
    node_stale_minutes: int = 30

    # Ventana (días) en la que get_nodos_clickhouse busca la última lectura de
    # cada sensor. Con 48 h, un corte de ingesta mayor a 2 días dejaba la
    # consulta sin filas y /api/nodes caía a TANGARA_NODES (mock marcado como
    # "activo"). Con 7 días los nodos mudos siguen saliendo, como "inactivo",
    # con su última lectura real.
    node_lookback_days: int = 7

    # Datos de demostración (services/mock_data.py::TANGARA_NODES) cuando
    # ClickHouse no responde, no tiene filas o falla. Default False: en
    # producción, sin datos reales los nodos salen "inactivo" y sin
    # mediciones; nunca se sirven lecturas fabricadas como si fueran en vivo.
    # Poner ECOPULSE_DEMO_DATA=1 solo para demos o desarrollo sin ClickHouse.
    ecopulse_demo_data: bool = False

    # --- IA (opcional, para el chatbot) ---
    anthropic_api_key: str | None = None

    # --- Endpoints de desarrollo ---
    # /api/meta/* (navegador de esquema de ClickHouse) y /api/chat/metrics
    # (hit_rate del router). Default False: apagados de verdad -- no un
    # header compartido comparado a mano, que da sensación de protección
    # sin serlo. Poner ENABLE_DEV_ENDPOINTS=true solo en dev local.
    enable_dev_endpoints: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte la cadena separada por comas en una lista limpia."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia cacheada de la configuración."""
    return Settings()
