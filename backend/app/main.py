from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles


from .config import FRONTEND_DIRECTORY
from .core.database import initialize_database
from .core.middleware import protect_writes
from .routes import auth, catalog, comments, favorites


@asynccontextmanager
async def lifespan(app: FastAPI):

    initialize_database()
    yield


app = FastAPI(title="Netherlands Explorer API", lifespan=lifespan)
app.middleware("http")(protect_writes)


app.include_router(catalog.router)
app.include_router(auth.router)
app.include_router(favorites.router)
app.include_router(comments.router)


if FRONTEND_DIRECTORY.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIRECTORY, html=True), name="frontend")
