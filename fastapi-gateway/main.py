from fastapi import FastAPI
from gateway.router import gateway_router

app = FastAPI(title="API Gateway")

app.include_router(gateway_router)