from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any
from app.db.session import get_db
from app.models.presupuesto import Presupuesto, Remito, EstadoPresupuesto

router = APIRouter()


# ─── Presupuestos ─────────────────────────────────────────────────────────────

class PresupuestoIn(BaseModel):
    empresa_id: str
    cliente_id: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    items: List[Any] = []
    imp_neto: float = 0
    imp_iva: float = 0
    imp_total: float = 0
    descuento_global: float = 0
    moneda: str = "PES"
    cotizacion: float = 1
    condicion_pago: Optional[str] = None
    validez_dias: int = 30
    notas: Optional[str] = None


class PresupuestoOut(BaseModel):
    id: str
    cliente_id: Optional[str]
    numero: Optional[int]
    imp_total: float
    moneda: str
    estado: str
    validez_dias: int
    comprobante_id: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PresupuestoOut])
def listar(empresa_id: str, estado: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Presupuesto).filter(Presupuesto.empresa_id == empresa_id)
    if estado:
        q = q.filter(Presupuesto.estado == estado)
    return q.order_by(Presupuesto.created_at.desc()).all()


@router.post("/", response_model=PresupuestoOut, status_code=201)
def crear(data: PresupuestoIn, db: Session = Depends(get_db)):
    # Auto-numerar
    ultimo = db.query(Presupuesto).filter(
        Presupuesto.empresa_id == data.empresa_id
    ).order_by(Presupuesto.numero.desc()).first()
    numero = (ultimo.numero or 0) + 1 if ultimo else 1

    p = Presupuesto(**data.model_dump(), numero=numero)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/{presupuesto_id}", response_model=PresupuestoOut)
def obtener(presupuesto_id: str, db: Session = Depends(get_db)):
    p = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
    if not p:
        raise HTTPException(404, "Presupuesto no encontrado")
    return p


@router.patch("/{presupuesto_id}/estado")
def cambiar_estado(presupuesto_id: str, estado: EstadoPresupuesto, db: Session = Depends(get_db)):
    p = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
    if not p:
        raise HTTPException(404, "Presupuesto no encontrado")
    p.estado = estado
    db.commit()
    return {"ok": True, "estado": estado}


@router.post("/{presupuesto_id}/convertir-factura")
def convertir_factura(presupuesto_id: str, db: Session = Depends(get_db)):
    p = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
    if not p:
        raise HTTPException(404, "Presupuesto no encontrado")
    if p.estado not in (EstadoPresupuesto.aceptado, EstadoPresupuesto.enviado):
        raise HTTPException(400, "El presupuesto debe estar aceptado o enviado para convertir")
    # Devuelve los datos para pre-llenar el formulario de nuevo comprobante
    return {
        "cliente_id": str(p.cliente_id) if p.cliente_id else None,
        "items": p.items,
        "imp_neto": float(p.imp_neto),
        "imp_iva": float(p.imp_iva),
        "imp_total": float(p.imp_total),
        "moneda": p.moneda,
        "condicion_pago": p.condicion_pago,
        "presupuesto_origen_id": str(p.id),
    }


# ─── Remitos ─────────────────────────────────────────────────────────────────

class RemitoIn(BaseModel):
    empresa_id: str
    cliente_id: Optional[str] = None
    comprobante_id: Optional[str] = None
    items: List[Any] = []
    deposito_origen: Optional[str] = None
    domicilio_entrega: Optional[str] = None
    transportista: Optional[str] = None
    observaciones: Optional[str] = None


class RemitoOut(BaseModel):
    id: str
    cliente_id: Optional[str]
    numero: Optional[int]
    comprobante_id: Optional[str]
    entregado: bool

    class Config:
        from_attributes = True


@router.get("/remitos", response_model=List[RemitoOut])
def listar_remitos(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Remito).filter(Remito.empresa_id == empresa_id).order_by(Remito.created_at.desc()).all()


@router.post("/remitos", response_model=RemitoOut, status_code=201)
def crear_remito(data: RemitoIn, db: Session = Depends(get_db)):
    ultimo = db.query(Remito).filter(Remito.empresa_id == data.empresa_id).order_by(Remito.numero.desc()).first()
    numero = (ultimo.numero or 0) + 1 if ultimo else 1
    r = Remito(**data.model_dump(), numero=numero)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/remitos/{remito_id}/entregar")
def marcar_entregado(remito_id: str, db: Session = Depends(get_db)):
    r = db.query(Remito).filter(Remito.id == remito_id).first()
    if not r:
        raise HTTPException(404, "Remito no encontrado")
    r.entregado = True
    db.commit()
    return {"ok": True}
