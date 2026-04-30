from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any
from app.db.session import get_db
from app.models.compra import Compra, EstadoCompra

router = APIRouter()


class CompraIn(BaseModel):
    empresa_id: str
    proveedor_id: Optional[str] = None
    tipo_comprobante: Optional[str] = None
    punto_venta: Optional[str] = None
    numero: Optional[int] = None
    fecha: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    imp_neto: float = 0
    imp_iva: float = 0
    imp_total: float
    moneda: str = "PES"
    cotizacion: float = 1
    ret_ganancias: float = 0
    ret_iibb: float = 0
    ret_iva: float = 0
    percepciones: float = 0
    items: List[Any] = []
    alicuotas_iva: List[Any] = []
    condicion_pago: Optional[str] = None
    observaciones: Optional[str] = None


class CompraOut(BaseModel):
    id: str
    proveedor_id: Optional[str]
    tipo_comprobante: Optional[str]
    punto_venta: Optional[str]
    numero: Optional[int]
    imp_total: float
    moneda: str
    ret_ganancias: float
    ret_iibb: float
    ret_iva: float
    estado: str
    stock_actualizado: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CompraOut])
def listar(empresa_id: str, estado: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Compra).filter(Compra.empresa_id == empresa_id)
    if estado:
        q = q.filter(Compra.estado == estado)
    return q.order_by(Compra.created_at.desc()).all()


@router.post("/", response_model=CompraOut, status_code=201)
def crear(data: CompraIn, db: Session = Depends(get_db)):
    c = Compra(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/{compra_id}", response_model=CompraOut)
def obtener(compra_id: str, db: Session = Depends(get_db)):
    c = db.query(Compra).filter(Compra.id == compra_id).first()
    if not c:
        raise HTTPException(404, "Compra no encontrada")
    return c


@router.put("/{compra_id}", response_model=CompraOut)
def actualizar(compra_id: str, data: CompraIn, db: Session = Depends(get_db)):
    c = db.query(Compra).filter(Compra.id == compra_id).first()
    if not c:
        raise HTTPException(404, "Compra no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/{compra_id}/estado")
def cambiar_estado(compra_id: str, estado: EstadoCompra, db: Session = Depends(get_db)):
    c = db.query(Compra).filter(Compra.id == compra_id).first()
    if not c:
        raise HTTPException(404, "Compra no encontrada")
    c.estado = estado
    db.commit()
    return {"ok": True, "estado": estado}
