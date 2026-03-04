import asyncio
from app.db import base
from sqlalchemy import inspect
import os

async def check_all_tables():
    inspector = inspect(base.engine)
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    
    for table in tables:
        columns = [c['name'] for c in inspector.get_columns(table)]
        print(f"Columns in {table}: {columns}")

if __name__ == "__main__":
    asyncio.run(check_all_tables())
