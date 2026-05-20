from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Wildfire Monitoring API"
    app_version: str = "1.0.0"
    environment: str = "development"

    db_host: str = "localhost"
    db_port: int = 5433
    db_name: str = "wildfire_db"
    db_user: str = "wildfire_admin"
    db_password: str = "wildfire_password"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    redis_url: str = "redis://localhost:6379"
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


settings = Settings()
