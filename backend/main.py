from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.db import Base, engine, migrate_clinic_schema
import models
from routers import clinics, doctors, login, register, services   # <-- doctors qo'shildi

Base.metadata.create_all(bind=engine)
migrate_clinic_schema()

app = FastAPI(title="TishYor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006",
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization", "Content-Type"],
    expose_headers=["*"],
)

uploads_directory = Path(__file__).resolve().parent / "uploads"
uploads_directory.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=str(uploads_directory)),
    name="uploads",
)

app.include_router(clinics.router)
app.include_router(services.router)
app.include_router(doctors.router)     
app.include_router(register.router)
app.include_router(login.router)


@app.get("/", tags=["Asosiy"], summary="Bosh sahifa")
def root():
    return {"message": "TishYor API ishlayapti"}