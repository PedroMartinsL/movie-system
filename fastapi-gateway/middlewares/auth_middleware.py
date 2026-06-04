from fastapi import Request, HTTPException
from core.security import verify_jwt

PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/register",
    "/health"
]

def is_public(path: str):
    return any(path.startswith(route) for route in PUBLIC_ROUTES)


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    if is_public(path):
        return await call_next(request)

    auth = request.headers.get("Authorization")

    if not auth:
        raise HTTPException(401, "Missing token")

    token = auth.replace("Bearer ", "")
    user = verify_jwt(token)

    request.state.user = user

    return await call_next(request)