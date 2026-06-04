from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    storage_url: str
    # auth_url: str

    class Config:
        env_file = ".env"

settings = Settings()