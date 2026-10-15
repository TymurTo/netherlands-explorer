import hmac
import sqlite3
from fastapi import APIRouter, Depends, HTTPException, Request, Response


from ..core.database import database
from ..schemas import Credentials
from ..core.security import (
    get_current_user,
    limit_auth_attempts,
    create_session,
    hash_password,
    hash_session_token,
    DUMMY_HASH,
)

router = APIRouter(tags=["Account"])


@router.post("/api/auth/register", status_code=201)
def register(body: Credentials, request: Request, response: Response):
    limit_auth_attempts(request)
    username = body.username.lower()
    try:
        with database() as db:
            cursor = db.execute(
                "INSERT INTO users(username,password_hash) VALUES (?,?)",
                (username, hash_password(body.password)),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(409, "This username is already taken.")
    create_session(response, request, user_id)
    return {"id": user_id, "username": username}


@router.post("/api/auth/login")
def login(body: Credentials, request: Request, response: Response):
    limit_auth_attempts(request)
    with database() as db:
        user = db.execute(
            "SELECT * FROM users WHERE username=?", (body.username.lower(),)
        ).fetchone()
    stored = user["password_hash"] if user else DUMMY_HASH
    matches = hmac.compare_digest(hash_password(body.password, stored.split(":")[0]), stored)
    if not user or not matches:
        raise HTTPException(401, "Incorrect username or password.")
    create_session(response, request, user["id"])
    return {"id": user["id"], "username": user["username"]}


@router.get("/api/auth/me")
def me(user=Depends(get_current_user)):
    return user


@router.post("/api/auth/logout", status_code=204)
def logout(request: Request, response: Response):
    with database() as db:
        db.execute(
            "DELETE FROM sessions WHERE token_hash=?",
            (hash_session_token(request.cookies.get("atlas_session", "")),),
        )
    response.delete_cookie("atlas_session", path="/")
