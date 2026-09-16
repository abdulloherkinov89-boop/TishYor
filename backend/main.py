from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db import engine, Base
import models
from routers import clinics
from routers import register

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TishYor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clinics.router)
app.include_router(register.router)


@app.get("/", tags=["Asosiy"], summary="Bosh sahifa")
def root():
    return {"message": "TishYor API ishlayapti"}
