import json
from fastapi import HTTPException
from ..config import CATALOG_PATH

CATALOG = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
ATTRACTIONS_BY_ID = {attraction["id"]: attraction for attraction in CATALOG["attractions"]}


def require_attraction(attraction_id):
    if attraction_id not in ATTRACTIONS_BY_ID:
        raise HTTPException(404, "Attraction not found.")
