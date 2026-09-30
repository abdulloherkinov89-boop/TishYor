from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker


SQLALCHEMY_DATABASE_URL = "sqlite:///./dental.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def migrate_clinic_schema():
    """Rebuild the legacy SQLite clinic table, preserving existing records."""
    if engine.dialect.name != "sqlite" or "clinics" not in inspect(engine).get_table_names():
        return

    from models.models import Clinic

    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(clinics)")).fetchall()
        column_names = {column[1] for column in columns}
        nullable_columns = {column[1] for column in columns if column[3] == 0}
        required_columns = {
            "latitude",
            "longitude",
            "patients_served",
            "status",
            "created_at",
        }
        if required_columns.issubset(column_names) and "license_number" in nullable_columns:
            return

        indexes = connection.execute(text("PRAGMA index_list(clinics)")).fetchall()
        for index in indexes:
            if not index[1].startswith("sqlite_autoindex"):
                connection.execute(text(f'DROP INDEX IF EXISTS "{index[1]}"'))

        connection.execute(text("ALTER TABLE clinics RENAME TO clinics_legacy"))
        Clinic.__table__.create(bind=connection)

        new_columns = [column.name for column in Clinic.__table__.columns]
        expressions = []
        selected_columns = []
        for name in new_columns:
            if name in column_names:
                expressions.append(f'"{name}"')
                selected_columns.append(f'"{name}"')
            elif name == "status":
                if "is_verified" in column_names:
                    expressions.append("CASE WHEN is_verified = 1 THEN 'approved' ELSE 'pending' END")
                else:
                    expressions.append("'pending'")
                selected_columns.append(f'"{name}"')
            elif name == "created_at":
                expressions.append("CURRENT_TIMESTAMP")
                selected_columns.append(f'"{name}"')
            elif name in {"tag", "rating", "gradient_start", "gradient_end"}:
                defaults = {
                    "tag": "KLINIKA",
                    "rating": "Yangi",
                    "gradient_start": "#7F77DD",
                    "gradient_end": "#5742A9",
                }
                expressions.append(f"'{defaults[name]}'")
                selected_columns.append(f'"{name}"')
            elif name == "patients_served":
                expressions.append("NULL")
                selected_columns.append(f'"{name}"')

        connection.execute(
            text(
                "INSERT INTO clinics ("
                + ", ".join(selected_columns)
                + ") SELECT "
                + ", ".join(expressions)
                + " FROM clinics_legacy"
            )
        )
        connection.execute(text("DROP TABLE clinics_legacy"))


def get_db():
    """Har bir so'rov uchun ma'lumotlar bazasi sessiyasini taqdim etadi."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()