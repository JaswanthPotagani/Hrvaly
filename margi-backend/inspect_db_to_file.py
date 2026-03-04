import asyncio
from app.db import base
from sqlalchemy import inspect
import os

async def check_all_tables():
    with open("db_inspect_output.txt", "w") as f:
        try:
            inspector = inspect(base.engine)
            tables = inspector.get_table_names()
            f.write(f"Tables: {tables}\n")
            
            for table in tables:
                columns = [c['name'] for c in inspector.get_columns(table)]
                f.write(f"Columns in {table}: {columns}\n")
            f.write("DONE\n")
        except Exception as e:
            f.write(f"ERROR: {str(e)}\n")

if __name__ == "__main__":
    asyncio.run(check_all_tables())
