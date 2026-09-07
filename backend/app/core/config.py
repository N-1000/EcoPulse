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
    cache_ttl_seconds: int = 300

    # --- IA (opcional, para el chatbot) ---
    anthropic_api_key: str | None = None

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte la cadena separada por comas en una lista limpia."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia cacheada de la configuración."""
    return Settings()
