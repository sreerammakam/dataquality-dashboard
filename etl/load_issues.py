import json
from pathlib import Path
from typing import Optional
import typer
from sqlalchemy import text
from utils import get_engine, get_dataset_id, insert_issue

app = typer.Typer(help="Load issues into data_quality_issues")


@app.command()
def file(file: Path, dataset_name: Optional[str] = None, dataset_id: Optional[int] = None):
    engine = get_engine()
    if dataset_id is None:
        if not dataset_name:
            raise typer.BadParameter("Provide dataset_name or dataset_id")
        found = get_dataset_id(engine, dataset_name)
        if not found:
            raise typer.BadParameter(f"Dataset not found: {dataset_name}")
        dataset_id = found

    data = json.loads(file.read_text()) if file.suffix.lower() in {'.json'} else None
    if data is None:
        raise typer.BadParameter("Only JSON supported in this sample loader")

    with engine.begin() as conn:
        for rec in data:
            insert_issue(conn, dataset_id, rec)

    typer.echo(f"Inserted {len(data)} issues for dataset_id={dataset_id}")


if __name__ == "__main__":
    app()
