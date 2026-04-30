from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel
from app.db.session import get_db
from app.models.comprobante import Comprobante, TipoComprobante, EstadoComprobante

router = APIRouter()


class ItemComprobante(BaseModel):
    descripcion: str
    cantidad: Decimal
    precio_unitario: Decimal
    alicuota_iva: Decimal = Decimal("21.00")


class ComprobanteIn(BaseModel):
    empresa_id: str
    cliente_id: Optional[str] = None
    tipo: TipoComprobante
    fecha: str
    concepto: int = 2
    items: List[ItemComprobante]
    moneda: str = "PES"
    cotizacion: Decimal = Decimal("1")


class ComprobanteOut(BaseModel):
    id: str
    tipo: str
    numero: Optional[int]
    imp_total: Decimal
    estado: str
    cae: Optional[str]
    cae_vencimiento: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ComprobanteOut])
def listar(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Comprobante).filter(Comprobante.empresa_id == empresa_id).all()


@router.post("/", response_model=ComprobanteOut, status_code=201)
def crear(data: ComprobanteIn, db: Session = Depends(get_db)):
    items = [i.model_dump() for i in data.items]
    imp_neto = sum(i["cantidad"] * i["precio_unitario"] for i in items)
    imp_iva = sum(
        i["cantidad"] * i["precio_unitario"] * i["alicuota_iva"] / 100
        for i in items
    )
    c = Comprobante(
        empresa_id=data.empresa_id,
        cliente_id=data.cliente_id,
        tipo=data.tipo,
        concepto=data.concepto,
        items=items,
        imp_neto=imp_neto,
        imp_iva=imp_iva,
        imp_total=imp_neto + imp_iva,
        moneda=data.moneda,
        cotizacion=data.cotizacion,
        estado=EstadoComprobante.borrador,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.post("/{id}/emitir", response_model=ComprobanteOut)
def emitir(id: str, db: Session = Depends(get_db)):
    c = db.query(Comprobante).filter(Comprobante.id == id).first()
    if not c:
        raise HTTPException(404, "Comprobante no encontrado")
    # La lógica ARCA se implementa en feature/arca-integration
    c.estado = EstadoComprobante.pendiente
    db.commit()
    db.refresh(c)
    return c
