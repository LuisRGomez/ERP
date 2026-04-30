from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.models.tesoreria import CuentaBancaria, MovimientoTesoreria, Cobro, Pago, TipoCuenta, TipoMovTesoria

router = APIRouter()


# ─── Cuentas bancarias / cajas ───────────────────────────────────────────────

class CuentaIn(BaseModel):
    empresa_id: str
    nombre: str
    tipo: TipoCuenta = TipoCuenta.banco
    banco: Optional[str] = None
    numero_cuenta: Optional[str] = None
    cbu: Optional[str] = None
    alias: Optional[str] = None
    moneda: str = "ARS"
    saldo_inicial: float = 0


class CuentaOut(BaseModel):
    id: str
    nombre: str
    tipo: str
    banco: Optional[str]
    cbu: Optional[str]
    alias: Optional[str]
    moneda: str
    saldo_inicial: float
    activo: bool

    class Config:
        from_attributes = True


@router.get("/cuentas", response_model=List[CuentaOut])
def listar_cuentas(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(CuentaBancaria).filter(
        CuentaBancaria.empresa_id == empresa_id,
        CuentaBancaria.activo == True,
    ).all()


@router.post("/cuentas", response_model=CuentaOut, status_code=201)
def crear_cuenta(data: CuentaIn, db: Session = Depends(get_db)):
    c = CuentaBancaria(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/cuentas/{cuenta_id}", response_model=CuentaOut)
def actualizar_cuenta(cuenta_id: str, data: CuentaIn, db: Session = Depends(get_db)):
    c = db.query(CuentaBancaria).filter(CuentaBancaria.id == cuenta_id).first()
    if not c:
        raise HTTPException(404, "Cuenta no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.get("/cuentas/{cuenta_id}/saldo")
def saldo_cuenta(cuenta_id: str, db: Session = Depends(get_db)):
    c = db.query(CuentaBancaria).filter(CuentaBancaria.id == cuenta_id).first()
    if not c:
        raise HTTPException(404, "Cuenta no encontrada")
    movs = db.query(MovimientoTesoreria).filter(MovimientoTesoreria.cuenta_id == cuenta_id).all()
    ingresos = sum(m.importe for m in movs if m.tipo in (TipoMovTesoria.cobro, TipoMovTesoria.ajuste))
    egresos = sum(m.importe for m in movs if m.tipo == TipoMovTesoria.pago)
    saldo = float(c.saldo_inicial) + float(ingresos) - float(egresos)
    return {"cuenta_id": cuenta_id, "saldo": saldo, "moneda": c.moneda}


# ─── Cobros ──────────────────────────────────────────────────────────────────

class CobroIn(BaseModel):
    empresa_id: str
    cliente_id: Optional[str] = None
    cuenta_id: Optional[str] = None
    comprobante_id: Optional[str] = None
    importe: float
    forma_pago: Optional[str] = None
    referencia: Optional[str] = None
    observaciones: Optional[str] = None


class CobroOut(BaseModel):
    id: str
    cliente_id: Optional[str]
    cuenta_id: Optional[str]
    comprobante_id: Optional[str]
    importe: float
    forma_pago: Optional[str]
    referencia: Optional[str]

    class Config:
        from_attributes = True


@router.get("/cobros", response_model=List[CobroOut])
def listar_cobros(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Cobro).filter(Cobro.empresa_id == empresa_id).order_by(Cobro.fecha.desc()).all()


@router.post("/cobros", response_model=CobroOut, status_code=201)
def registrar_cobro(data: CobroIn, db: Session = Depends(get_db)):
    cobro = Cobro(**data.model_dump())
    db.add(cobro)
    # Registrar movimiento en cuenta
    if data.cuenta_id:
        mov = MovimientoTesoreria(
            empresa_id=data.empresa_id,
            cuenta_id=data.cuenta_id,
            tipo=TipoMovTesoria.cobro,
            importe=data.importe,
            concepto=f"Cobro - {data.referencia or ''}",
            origen="cobro",
        )
        db.add(mov)
    db.commit()
    db.refresh(cobro)
    return cobro


# ─── Pagos ───────────────────────────────────────────────────────────────────

class PagoIn(BaseModel):
    empresa_id: str
    proveedor_id: Optional[str] = None
    cuenta_id: Optional[str] = None
    compra_id: Optional[str] = None
    importe: float
    forma_pago: Optional[str] = None
    referencia: Optional[str] = None
    observaciones: Optional[str] = None


class PagoOut(BaseModel):
    id: str
    proveedor_id: Optional[str]
    cuenta_id: Optional[str]
    compra_id: Optional[str]
    importe: float
    forma_pago: Optional[str]
    referencia: Optional[str]

    class Config:
        from_attributes = True


@router.get("/pagos", response_model=List[PagoOut])
def listar_pagos(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Pago).filter(Pago.empresa_id == empresa_id).order_by(Pago.fecha.desc()).all()


@router.post("/pagos", response_model=PagoOut, status_code=201)
def registrar_pago(data: PagoIn, db: Session = Depends(get_db)):
    pago = Pago(**data.model_dump())
    db.add(pago)
    if data.cuenta_id:
        mov = MovimientoTesoreria(
            empresa_id=data.empresa_id,
            cuenta_id=data.cuenta_id,
            tipo=TipoMovTesoria.pago,
            importe=data.importe,
            concepto=f"Pago - {data.referencia or ''}",
            origen="pago",
        )
        db.add(mov)
    db.commit()
    db.refresh(pago)
    return pago


# ─── Resumen tesorería ───────────────────────────────────────────────────────

@router.get("/resumen")
def resumen(empresa_id: str, db: Session = Depends(get_db)):
    cuentas = db.query(CuentaBancaria).filter(
        CuentaBancaria.empresa_id == empresa_id, CuentaBancaria.activo == True
    ).all()
    total_cobros = db.query(func.sum(Cobro.importe)).filter(Cobro.empresa_id == empresa_id).scalar() or 0
    total_pagos = db.query(func.sum(Pago.importe)).filter(Pago.empresa_id == empresa_id).scalar() or 0
    return {
        "total_cuentas": len(cuentas),
        "total_cobros": float(total_cobros),
        "total_pagos": float(total_pagos),
        "posicion_neta": float(total_cobros) - float(total_pagos),
    }
