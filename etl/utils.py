import os
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        user = os.getenv("POSTGRES_USER", "dq_user")
        password = os.getenv("POSTGRES_PASSWORD", "dq_password")
        host = os.getenv("POSTGRES_HOST", "db")
        port = os.getenv("POSTGRES_PORT", "5432")
        db = os.getenv("POSTGRES_DB", "dq_db")
        url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"
    return url


def get_engine(echo: bool = False) -> Engine:
    return create_engine(get_database_url(), echo=echo, future=True)


def get_dataset_id(engine: Engine, dataset_name: str) -> Optional[int]:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT id FROM datasets WHERE name = :n"), {"n": dataset_name}).first()
        return int(row[0]) if row else None


def upsert_metric(conn, dataset_id: int, record: dict):
    sql = text(
        """
        INSERT INTO data_quality_metrics
          (dataset_id, metric_date, overall_score, completeness, accuracy, consistency, timeliness)
        VALUES
          (:dataset_id, :metric_date, :overall_score, :completeness, :accuracy, :consistency, :timeliness)
        ON CONFLICT (dataset_id, metric_date) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          completeness = EXCLUDED.completeness,
          accuracy = EXCLUDED.accuracy,
          consistency = EXCLUDED.consistency,
          timeliness = EXCLUDED.timeliness
        """
    )
    conn.execute(sql, {"dataset_id": dataset_id, **record})


def insert_issue(conn, dataset_id: int, record: dict):
    sql = text(
        """
        INSERT INTO data_quality_issues
          (dataset_id, rule_id, issue_date, severity, title, details, sample_records)
        VALUES
          (:dataset_id, :rule_id, :issue_date, :severity, :title, :details, :sample_records)
        """
    )
    params = {"dataset_id": dataset_id, **record}
    conn.execute(sql, params)
