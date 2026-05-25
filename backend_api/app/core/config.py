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

    # NASA FIRMS satellite hotspot feed
    # Register free at: https://firms.modaps.eosdis.nasa.gov/api/
    firms_map_key: str = ""
    # Bounding box for Thanh Hoa province: west,south,east,north
    firms_bbox: str = "104.2,19.0,106.5,20.8"
    # Auto-sync interval in hours (0 = disabled)
    firms_sync_hours: int = 3

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


settings = Settings()
