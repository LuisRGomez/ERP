from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from app.db.session import get_db
from app.models.inventario import Producto, MovimientoStock, Deposito, TipoMovimiento

router = APIRouter()


# ─── Productos ───────────────────────────────────────────────────────────────

class ProductoIn(BaseModel):
    empresa_id: str
    codigo: Optional[str] = None
    descripcion: str
    tipo: str = "producto"
    unidad_medida: str = "UN"
    precio_venta: float = 0
    precio_compra: float = 0
    alicuota_iva: float = 21
    stock_minimo: float = 0
    codigo_barras: Optional[str] = None


class ProductoOut(BaseModel):
    id: str
    codigo: Optional[str]
    descripcion: str
    tipo: str
    unidad_medida: str
    precio_venta: float
    precio_compra: float
    alicuota_iva: float
    stock_actual: float
    stock_minimo: float
    activo: bool

    class Config:
        from_attributes = True


@router.get("/productos", response_model=List[ProductoOut])
def listar_productos(empresa_id: str, tipo: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Producto).filter(Producto.empresa_id == empresa_id, Producto.activo == True)
    if tipo:
        q = q.filter(Producto.tipo == tipo)
    return q.order_by(Producto.descripcion).all()


@router.post("/productos", response_model=ProductoOut, status_code=201)
def crear_producto(data: ProductoIn, db: Session = Depends(get_db)):
    p = Producto(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/productos/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: str, data: ProductoIn, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/productos/{producto_id}", status_code=204)
def eliminar_producto(producto_id: str, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    p.activo = False
    db.commit()


# ─── Movimientos de stock ─────────────────────────────────────────────────────

class MovimientoIn(BaseModel):
    empresa_id: str
    producto_id: str
    deposito_id: Optional[str] = None
    tipo: TipoMovimiento
    cantidad: float
    costo_unitario: float = 0
    observaciones: Optional[str] = None
    origen: str = "ajuste_manual"


class MovimientoOut(BaseModel):
    id: str
    producto_id: str
    tipo: str
    cantidad: float
    costo_unitario: float
    origen: str
    observaciones: Optional[str]

    class Config:
        from_attributes = True


@router.get("/movimientos", response_model=List[MovimientoOut])
def listar_movimientos(empresa_id: str, producto_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(MovimientoStock).filter(MovimientoStock.empresa_id == empresa_id)
    if producto_id:
        q = q.filter(MovimientoStock.producto_id == producto_id)
    return q.order_by(MovimientoStock.fecha.desc()).limit(200).all()


@router.post("/movimientos", response_model=MovimientoOut, status_code=201)
def registrar_movimiento(data: MovimientoIn, db: Session = Depends(get_db)):
    mov = MovimientoStock(**data.model_dump())
    db.add(mov)

    # Actualizar stock_actual en el producto
    p = db.query(Producto).filter(Producto.id == data.producto_id).first()
    if p:
        if data.tipo in (TipoMovimiento.ingreso,):
            p.stock_actual += Decimal(str(data.cantidad))
        elif data.tipo in (TipoMovimiento.egreso,):
            p.stock_actual -= Decimal(str(data.cantidad))

    db.commit()
    db.refresh(mov)
    return mov


@router.get("/stock-bajo", response_model=List[ProductoOut])
def productos_stock_bajo(empresa_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Producto)
        .filter(
            Producto.empresa_id == empresa_id,
            Producto.activo == True,
            Producto.tipo == "producto",
            Producto.stock_actual <= Producto.stock_minimo,
        )
        .all()
    )


# ─── Depósitos ────────────────────────────────────────────────────────────────

class DepositoOut(BaseModel):
    id: str
    nombre: str
    direccion: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


@router.get("/depositos", response_model=List[DepositoOut])
def listar_depositos(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Deposito).filter(Deposito.empresa_id == empresa_id).all()
