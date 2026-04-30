from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.models.contabilidad import CuentaContable, Asiento, LineaAsiento, TipoCuenta

router = APIRouter()

PLAN_BASICO = [
    ("1", "ACTIVO", "Activo", 1), ("1.1", "ACTIVO", "Activo Corriente", 2),
    ("1.1.1", "ACTIVO", "Caja y Bancos", 3), ("1.1.2", "ACTIVO", "Créditos por Ventas", 3),
    ("1.1.3", "ACTIVO", "Bienes de Cambio", 3), ("1.2", "ACTIVO", "Activo No Corriente", 2),
    ("1.2.1", "ACTIVO", "Bienes de Uso", 3),
    ("2", "PASIVO", "Pasivo", 1), ("2.1", "PASIVO", "Pasivo Corriente", 2),
    ("2.1.1", "PASIVO", "Deudas Comerciales", 3), ("2.1.2", "PASIVO", "Deudas Fiscales", 3),
    ("2.1.3", "PASIVO", "Remuneraciones a Pagar", 3),
    ("3", "PATRIMONIO", "Patrimonio Neto", 1), ("3.1", "PATRIMONIO", "Capital Social", 2),
    ("3.2", "PATRIMONIO", "Resultados Acumulados", 2),
    ("4", "INGRESO", "Ingresos", 1), ("4.1", "INGRESO", "Ventas", 2),
    ("4.1.1", "INGRESO", "Ventas de Productos", 3), ("4.1.2", "INGRESO", "Ventas de Servicios", 3),
    ("5", "EGRESO", "Egresos", 1), ("5.1", "EGRESO", "Costo de Ventas", 2),
    ("5.2", "EGRESO", "Gastos de Administración", 2), ("5.3", "EGRESO", "Gastos de Comercialización", 2),
    ("5.4", "EGRESO", "Cargas Sociales", 2), ("5.5", "EGRESO", "Impuestos y Tasas", 2),
]


# ─── Cuentas contables ────────────────────────────────────────────────────────

class CuentaIn(BaseModel):
    empresa_id: str
    codigo: str
    nombre: str
    tipo: TipoCuenta
    nivel: int = 1
    padre_id: Optional[str] = None


class CuentaOut(BaseModel):
    id: str
    codigo: str
    nombre: str
    tipo: str
    nivel: int
    padre_id: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


@router.get("/cuentas", response_model=List[CuentaOut])
def listar_cuentas(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(CuentaContable).filter(
        CuentaContable.empresa_id == empresa_id,
        CuentaContable.activo == True,
    ).order_by(CuentaContable.codigo).all()


@router.post("/cuentas/inicializar")
def inicializar_plan(empresa_id: str, db: Session = Depends(get_db)):
    """Crea el plan de cuentas básico si la empresa no tiene ninguno."""
    existente = db.query(CuentaContable).filter(CuentaContable.empresa_id == empresa_id).first()
    if existente:
        return {"ok": False, "msg": "La empresa ya tiene un plan de cuentas"}
    for codigo, tipo, nombre, nivel in PLAN_BASICO:
        c = CuentaContable(empresa_id=empresa_id, codigo=codigo, nombre=nombre, tipo=tipo, nivel=nivel)
        db.add(c)
    db.commit()
    return {"ok": True, "cuentas_creadas": len(PLAN_BASICO)}


@router.post("/cuentas", response_model=CuentaOut, status_code=201)
def crear_cuenta(data: CuentaIn, db: Session = Depends(get_db)):
    c = CuentaContable(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/cuentas/{cuenta_id}", response_model=CuentaOut)
def actualizar_cuenta(cuenta_id: str, data: CuentaIn, db: Session = Depends(get_db)):
    c = db.query(CuentaContable).filter(CuentaContable.id == cuenta_id).first()
    if not c:
        raise HTTPException(404, "Cuenta no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


# ─── Asientos ─────────────────────────────────────────────────────────────────

class LineaIn(BaseModel):
    cuenta_id: str
    debe: float = 0
    haber: float = 0
    descripcion: Optional[str] = None


class LineaOut(BaseModel):
    cuenta_id: str
    cuenta_codigo: str
    cuenta_nombre: str
    debe: float
    haber: float
    descripcion: Optional[str]

    class Config:
        from_attributes = True


class AsientoIn(BaseModel):
    empresa_id: str
    fecha: Optional[str] = None
    descripcion: str
    origen: Optional[str] = None
    origen_id: Optional[str] = None
    lineas: List[LineaIn]


class AsientoOut(BaseModel):
    id: str
    numero: Optional[int]
    fecha: str
    descripcion: str
    origen: Optional[str]
    total_debe: float
    total_haber: float

    class Config:
        from_attributes = True


@router.get("/asientos", response_model=List[AsientoOut])
def listar_asientos(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Asiento).filter(
        Asiento.empresa_id == empresa_id
    ).order_by(Asiento.fecha.desc()).limit(200).all()


@router.post("/asientos", response_model=AsientoOut, status_code=201)
def crear_asiento(data: AsientoIn, db: Session = Depends(get_db)):
    total_debe = sum(l.debe for l in data.lineas)
    total_haber = sum(l.haber for l in data.lineas)
    if round(total_debe, 2) != round(total_haber, 2):
        raise HTTPException(400, f"El asiento no balancea: debe={total_debe} haber={total_haber}")

    ultimo = db.query(Asiento).filter(Asiento.empresa_id == data.empresa_id).order_by(Asiento.numero.desc()).first()
    numero = (ultimo.numero or 0) + 1 if ultimo else 1

    asiento = Asiento(
        empresa_id=data.empresa_id,
        descripcion=data.descripcion,
        origen=data.origen,
        numero=numero,
        total_debe=total_debe,
        total_haber=total_haber,
    )
    db.add(asiento)
    db.flush()

    for l in data.lineas:
        cuenta = db.query(CuentaContable).filter(CuentaContable.id == l.cuenta_id).first()
        if not cuenta:
            raise HTTPException(404, f"Cuenta {l.cuenta_id} no encontrada")
        linea = LineaAsiento(
            asiento_id=asiento.id,
            cuenta_id=l.cuenta_id,
            debe=l.debe,
            haber=l.haber,
            descripcion=l.descripcion,
        )
        db.add(linea)

    db.commit()
    db.refresh(asiento)
    return asiento


@router.get("/asientos/{asiento_id}")
def obtener_asiento(asiento_id: str, db: Session = Depends(get_db)):
    a = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not a:
        raise HTTPException(404, "Asiento no encontrado")
    return {
        "id": str(a.id),
        "numero": a.numero,
        "fecha": str(a.fecha),
        "descripcion": a.descripcion,
        "origen": a.origen,
        "total_debe": float(a.total_debe),
        "total_haber": float(a.total_haber),
        "lineas": [
            {
                "cuenta_id": str(l.cuenta_id),
                "cuenta_codigo": l.cuenta.codigo,
                "cuenta_nombre": l.cuenta.nombre,
                "debe": float(l.debe),
                "haber": float(l.haber),
                "descripcion": l.descripcion,
            }
            for l in a.lineas
        ],
    }
