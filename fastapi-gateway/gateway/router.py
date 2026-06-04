from fastapi import APIRouter, Request
from gateway.proxy import proxy_request

gateway_router = APIRouter()

# STORAGE SERVICE
@gateway_router.api_route(
    "/storage/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE"]
)
async def storage_proxy(path: str, request: Request):
    return await proxy_request(
        service_name="storage",
        path=path,
        request=request
    )

# AUTH SERVICE
@gateway_router.api_route(
    "/auth/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE"]
)
async def auth_proxy(path: str, request: Request):
    return await proxy_request(
        service_name="auth",
        path=path,
        request=request
    )