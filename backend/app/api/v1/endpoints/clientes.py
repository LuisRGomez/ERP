from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.models.cliente import Cliente, TipoDocumento

router = APIRouter()


class ClienteIn(BaseModel):
    empresa_id: str
    razon_social: str
    tipo_doc: TipoDocumento = TipoDocumento.cuit
    nro_doc: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    domicilio: Optional[str] = None
    condicion_iva: Optional[str] = None


class ClienteOut(BaseModel):
    id: str
    razon_social: str
    tipo_doc: str
    nro_doc: Optional[str]
    email: Optional[str]
    condicion_iva: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ClienteOut])
def listar(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Cliente).filter(Cliente.empresa_id == empresa_id).all()


@router.post("/", response_model=ClienteOut, status_code=201)
def crear(data: ClienteIn, db: Session = Depends(get_db)):
    c = Cliente(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c
