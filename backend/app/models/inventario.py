from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, func, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class TipoMovimiento(str, enum.Enum):
    ingreso = "INGRESO"          # compra, ajuste +
    egreso = "EGRESO"            # venta, ajuste -
    transferencia = "TRANSFERENCIA"
    ajuste = "AJUSTE"


class Deposito(Base):
    __tablename__ = "depositos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    nombre = Column(String, nullable=False)
    direccion = Column(String)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    movimientos = relationship("MovimientoStock", back_populates="deposito")


class MovimientoStock(Base):
    __tablename__ = "movimientos_stock"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    deposito_id = Column(UUID(as_uuid=True), ForeignKey("depositos.id"), nullable=True)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id"), nullable=False)

    tipo = Column(Enum(TipoMovimiento), nullable=False)
    cantidad = Column(Numeric(15, 4), nullable=False)
    costo_unitario = Column(Numeric(15, 4), default=0)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    origen = Column(String(100))   # "compra", "venta", "ajuste_manual", etc.
    origen_id = Column(UUID(as_uuid=True), nullable=True)
    observaciones = Column(Text)

    deposito = relationship("Deposito", back_populates="movimientos")
    producto = relationship("Producto", back_populates="movimientos_stock")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    codigo = Column(String(50))
    descripcion = Column(String, nullable=False)
    tipo = Column(String(20), default="producto")    # producto | servicio
    unidad_medida = Column(String(20), default="UN")
    precio_venta = Column(Numeric(15, 4), default=0)
    precio_compra = Column(Numeric(15, 4), default=0)
    alicuota_iva = Column(Numeric(5, 2), default=21)
    stock_actual = Column(Numeric(15, 4), default=0)
    stock_minimo = Column(Numeric(15, 4), default=0)
    codigo_barras = Column(String(50))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="productos")
    movimientos_stock = relationship("MovimientoStock", back_populates="producto")

