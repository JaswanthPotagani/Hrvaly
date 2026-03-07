import asyncio
from app.db.base import engine
from sqlalchemy import inspect

def main():
    inspector = inspect(engine)
    columns = inspector.get_columns('Assessment')
    for c in columns:
        print(f"{c['name']}: {c['type']}")

if __name__ == "__main__":
    main()
