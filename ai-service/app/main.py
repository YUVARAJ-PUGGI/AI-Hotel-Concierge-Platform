from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="../.env")

from app.api.routes import router

app = FastAPI(title="Hotel Concierge AI Service", version="0.1.0")
app.include_router(router)
