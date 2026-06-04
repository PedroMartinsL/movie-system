import httpx
from fastapi import Request
from config import settings

SERVICES = {
    "storage": settings.storage_url,
    # "auth": settings.auth_url,
}

async def proxy_request(service_name: str, path: str, request: Request):
    base_url = SERVICES[service_name]

    url = f"{base_url}/{path}"

    headers = {
        k.decode(): v.decode()
        for k, v in request.headers.raw
        if k.lower() not in [b"host", b"content-length"]
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            params=request.query_params,
            content=await request.body(),
        )

    try:
        return response.json()
    except Exception:
        return response.text