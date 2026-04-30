from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.empresa import Empresa, CondicionIVA

router = APIRouter()


class EmpresaIn(BaseModel):
    owner_id: str
    cuit: str
    razon_social: str
    nombre_fantasia: Optional[str] = None
    domicilio_fiscal: Optional[str] = None
    condicion_iva: CondicionIVA


class EmpresaOut(BaseModel):
    id: str
    cuit: str
    razon_social: str
    condicion_iva: str
    arca_habilitada: bool

    class Config:
        from_attributes = True


@router.post("/", response_model=EmpresaOut, status_code=201)
def crear(data: EmpresaIn, db: Session = Depends(get_db)):
    e = Empresa(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.get("/{id}", response_model=EmpresaOut)
def obtener(id: str, db: Session = Depends(get_db)):
    e = db.query(Empresa).filter(Empresa.id == id).first()
    if not e:
        raise HTTPException(404, "Empresa no encontrada")
    return e
