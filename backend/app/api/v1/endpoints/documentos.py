import uuid
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.comprobante import Comprobante
from app.core.config import settings

router = APIRouter()

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_SIZE_MB = 10


def _get_storage_path() -> Path:
    p = Path(settings.LOCAL_STORAGE_PATH)
    p.mkdir(parents=True, exist_ok=True)
    return p


@router.post("/upload")
async def upload_documento(
    file: UploadFile = File(...),
    tipo: str = Query(..., description="comprobante | recibido | adjunto"),
    empresa_id: str = Query(...),
    comprobante_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Sube un PDF (factura generada o recibida) y lo vincula al comprobante."""
    # Validaciones
    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"El archivo supera los {MAX_SIZE_MB} MB")
    if file.content_type not in ALLOWED_TYPES and not (file.filename or "").endswith(".pdf"):
        raise HTTPException(400, "Solo se aceptan PDF, JPG o PNG")

    # Directorio destino
    dest_dir = _get_storage_path() / tipo / empresa_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Nombre único
    ext = Path(file.filename or "archivo.pdf").suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_file = dest_dir / filename

    with open(dest_file, "wb") as f:
        f.write(content)

    relative_path = f"{tipo}/{empresa_id}/{filename}"

    # Vincular al comprobante si se especificó
    if comprobante_id:
        c = db.query(Comprobante).filter(Comprobante.id == comprobante_id).first()
        if c:
            if tipo == "comprobante":
                c.pdf_path = relative_path
            else:
                c.uploaded_pdf_path = relative_path
            db.commit()

    return {
        "ok": True,
        "filename": filename,
        "path": relative_path,
        "url": f"/api/v1/documentos/archivo/{relative_path}",
        "size_kb": round(len(content) / 1024, 1),
    }


@router.get("/archivo/{tipo}/{empresa_id}/{filename}")
def descargar_documento(tipo: str, empresa_id: str, filename: str):
    """Descarga / sirve un documento almacenado."""
    file_path = _get_storage_path() / tipo / empresa_id / filename
    if not file_path.exists():
        raise HTTPException(404, "Archivo no encontrado")
    media_type = "application/pdf" if filename.endswith(".pdf") else "image/jpeg"
    return FileResponse(str(file_path), media_type=media_type, filename=filename)


@router.delete("/archivo/{tipo}/{empresa_id}/{filename}")
def eliminar_documento(
    tipo: str,
    empresa_id: str,
    filename: str,
    comprobante_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Elimina un documento del storage y desvincula del comprobante."""
    file_path = _get_storage_path() / tipo / empresa_id / filename
    if file_path.exists():
        os.remove(str(file_path))

    if comprobante_id:
        c = db.query(Comprobante).filter(Comprobante.id == comprobante_id).first()
        if c:
            if tipo == "comprobante":
                c.pdf_path = None
            else:
                c.uploaded_pdf_path = None
            db.commit()

    return {"ok": True}
