from jose import jwt, JWTError
from fastapi import HTTPException
from core.config import settings

def verify_jwt(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"]
        )
        return payload

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")