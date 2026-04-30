from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def status():
    # Implementación completa en feature/arca-integration
    return {"message": "ARCA integration — pendiente en feature/arca-integration"}
