from fastapi import APIRouter, Depends
from ..core.catalog_store import require_attraction
from ..core.database import database
from ..core.security import get_current_user

router = APIRouter(tags=["Favorites"])


@router.get("/api/favorites")
def favorites(user=Depends(get_current_user)):
    with database() as db:
        rows = db.execute(
            "SELECT attraction_id FROM favorites WHERE user_id=?", (user["id"],)
        ).fetchall()
    return [row["attraction_id"] for row in rows]


@router.put("/api/favorites/{attraction_id}", status_code=204)
def add_favorite(attraction_id: str, user=Depends(get_current_user)):
    require_attraction(attraction_id)
    with database() as db:

        db.execute("INSERT OR IGNORE INTO favorites VALUES (?,?)", (user["id"], attraction_id))


@router.delete("/api/favorites/{attraction_id}", status_code=204)
def remove_favorite(attraction_id: str, user=Depends(get_current_user)):
    require_attraction(attraction_id)
    with database() as db:
        db.execute(
            "DELETE FROM favorites WHERE user_id=? AND attraction_id=?", (user["id"], attraction_id)
        )
