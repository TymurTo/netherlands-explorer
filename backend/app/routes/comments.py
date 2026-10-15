from fastapi import APIRouter, Depends, HTTPException, Query
from ..core.catalog_store import require_attraction
from ..core.database import database
from ..schemas import CommentInput
from ..core.security import get_current_user

router = APIRouter(tags=["Comments"])


@router.get("/api/attractions/{attraction_id}/comments")
def comments(
    attraction_id: str,
    before: int | None = Query(default=None, gt=0),
    limit: int = Query(default=50, ge=1, le=100),
):
    require_attraction(attraction_id)
    condition = " AND comments.id < ?" if before is not None else ""
    parameters = [attraction_id]
    if before is not None:
        parameters.append(before)
    parameters.append(limit + 1)
    with database() as db:
        rows = db.execute(
            "SELECT comments.id, user_id, username, body, created_at FROM comments "
            "JOIN users ON users.id = comments.user_id WHERE attraction_id=?"
            + condition
            + " ORDER BY comments.id DESC LIMIT ?",
            parameters,
        ).fetchall()
    items = [dict(row) for row in rows[:limit]]
    has_more = len(rows) > limit
    return {
        "items": items,
        "has_more": has_more,
        "next_cursor": items[-1]["id"] if has_more else None,
    }


@router.post("/api/attractions/{attraction_id}/comments", status_code=201)
def add_comment(attraction_id: str, body: CommentInput, user=Depends(get_current_user)):
    require_attraction(attraction_id)
    with database() as db:
        cursor = db.execute(
            "INSERT INTO comments(user_id,attraction_id,body) VALUES (?,?,?)",
            (user["id"], attraction_id, body.body),
        )
    return {"id": cursor.lastrowid}


@router.delete("/api/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, user=Depends(get_current_user)):
    with database() as db:
        cursor = db.execute(
            "DELETE FROM comments WHERE id=? AND user_id=?", (comment_id, user["id"])
        )
        if not cursor.rowcount:
            raise HTTPException(404, "Comment not found or owned by another user.")
