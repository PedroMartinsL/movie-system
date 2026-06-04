from fastapi import FastAPI
from gateway.router import gateway_router
from middlewares.auth_middleware import auth_middleware

app = FastAPI(title="API Gateway")

app.middleware("http")(auth_middleware)

app.include_router(gateway_router)

@app.get("/health")
def health():
    return {"status": "ok"}