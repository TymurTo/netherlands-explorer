from fastapi import APIRouter
from ..core.catalog_store import CATALOG

router = APIRouter(tags=["Catalog"])


@router.get("/api/health")
def health():
    return {"status": "ok"}


@router.get("/api/catalog")
def catalog():
    return CATALOG
