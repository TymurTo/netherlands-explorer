import hashlib
import secrets
import time
from fastapi import HTTPException, Request, Response


from ..config import SESSION_TTL, SECURE_COOKIE, AUTH_ATTEMPT_WINDOW, MAX_AUTH_ATTEMPTS
from .database import database


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return f"{salt}:{digest}"


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def get_current_user(request: Request):
    token = request.cookies.get("atlas_session", "")
    with database() as db:
        row = db.execute(
            """SELECT users.id, users.username FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE token_hash=? AND expires_at>?""",
            (hash_session_token(token), time.time()),
        ).fetchone()
    if not row:
        raise HTTPException(401, "Please sign in.")
    return dict(row)


def limit_auth_attempts(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    with database() as db:
        db.execute("DELETE FROM auth_attempts WHERE at<?", (now - AUTH_ATTEMPT_WINDOW,))
        count = db.execute("SELECT COUNT(*) FROM auth_attempts WHERE ip=?", (ip,)).fetchone()[0]
        if count >= MAX_AUTH_ATTEMPTS:
            raise HTTPException(429, "Too many attempts. Try again in 10 minutes.")
        db.execute("INSERT INTO auth_attempts VALUES (?,?)", (ip, now))


def create_session(response: Response, request: Request, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    with database() as db:

        db.execute(
            "DELETE FROM sessions WHERE expires_at<? OR token_hash=?",
            (time.time(), hash_session_token(request.cookies.get("atlas_session", ""))),
        )
        db.execute(
            "INSERT INTO sessions VALUES (?,?,?)",
            (hash_session_token(token), user_id, time.time() + SESSION_TTL),
        )
    response.set_cookie(
        "atlas_session",
        token,
        max_age=SESSION_TTL,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite="lax",
        path="/",
    )


DUMMY_HASH = hash_password("dummy-password-for-timing")
