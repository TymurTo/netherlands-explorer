from fastapi import Request
from fastapi.responses import JSONResponse
from ..config import ALLOWED_ORIGINS


async def protect_writes(request: Request, call_next):

    if request.url.path.startswith("/api/") and request.method in {
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
    }:
        origin = request.headers.get("origin")
        if request.headers.get("x-atlas-request") != "1" or (
            origin and origin not in ALLOWED_ORIGINS
        ):
            return JSONResponse({"detail": "Invalid request origin."}, status_code=403)
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
