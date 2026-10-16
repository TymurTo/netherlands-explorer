from contextlib import contextmanager
import sqlite3


from ..config import SCHEMA_PATH, DATABASE_PATH

DB_PATH = DATABASE_PATH


@contextmanager
def database():
    connection = sqlite3.connect(DB_PATH, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialize_database():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with database() as connection:
        connection.executescript(schema)
