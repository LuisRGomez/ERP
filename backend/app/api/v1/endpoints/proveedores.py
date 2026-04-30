from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.db.session import get_db
from app.models.proveedor import Proveedor, TipoDocProveedor

router = APIRouter()


class ProveedorIn(BaseModel):
    empresa_id: str
    razon_social: str
    nombre_fantasia: Optional[str] = None
    tipo_doc: TipoDocProveedor = TipoDocProveedor.cuit
    nro_doc: Optional[str] = None
    condicion_iva: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    contacto: Optional[str] = None
    domicilio: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    pais: str = "Argentina"
    condicion_pago: Optional[str] = None
    cuenta_bancaria: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    notas: Optional[str] = None


class ProveedorOut(BaseModel):
    id: str
    razon_social: str
    nombre_fantasia: Optional[str]
    tipo_doc: str
    nro_doc: Optional[str]
    condicion_iva: Optional[str]
    email: Optional[str]
    telefono: Optional[str]
    localidad: Optional[str]
    condicion_pago: Optional[str]
    cbu: Optional[str]
    alias_cbu: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProveedorOut])
def listar(empresa_id: str, activo: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(Proveedor).filter(Proveedor.empresa_id == empresa_id)
    if activo is not None:
        q = q.filter(Proveedor.activo == activo)
    return q.order_by(Proveedor.razon_social).all()


@router.post("/", response_model=ProveedorOut, status_code=201)
def crear(data: ProveedorIn, db: Session = Depends(get_db)):
    p = Proveedor(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/{proveedor_id}", response_model=ProveedorOut)
def obtener(proveedor_id: str, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    return p


@router.put("/{proveedor_id}", response_model=ProveedorOut)
def actualizar(proveedor_id: str, data: ProveedorIn, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{proveedor_id}", status_code=204)
def eliminar(proveedor_id: str, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    p.activo = False
    db.commit()
