from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, func, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class TipoCuenta(str, enum.Enum):
    activo = "ACTIVO"
    pasivo = "PASIVO"
    patrimonio = "PATRIMONIO"
    ingreso = "INGRESO"
    egreso = "EGRESO"


class CuentaContable(Base):
    __tablename__ = "cuentas_contables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    padre_id = Column(UUID(as_uuid=True), ForeignKey("cuentas_contables.id"), nullable=True)
    codigo = Column(String(20), nullable=False)
    nombre = Column(String, nullable=False)
    tipo = Column(Enum(TipoCuenta), nullable=False)
    nivel = Column(Integer, default=1)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="cuentas_contables")
    hijos = relationship("CuentaContable", backref="padre", remote_side=[id])
    lineas = relationship("LineaAsiento", back_populates="cuenta")


class Asiento(Base):
    __tablename__ = "asientos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    numero = Column(Integer)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    descripcion = Column(String(500), nullable=False)
    origen = Column(String(50))       # "comprobante", "compra", "cobro", "pago", "manual"
    origen_id = Column(UUID(as_uuid=True), nullable=True)
    total_debe = Column(Numeric(15, 2), default=0)
    total_haber = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="asientos")
    lineas = relationship("LineaAsiento", back_populates="asiento", cascade="all, delete-orphan")


class LineaAsiento(Base):
    __tablename__ = "lineas_asiento"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asiento_id = Column(UUID(as_uuid=True), ForeignKey("asientos.id"), nullable=False)
    cuenta_id = Column(UUID(as_uuid=True), ForeignKey("cuentas_contables.id"), nullable=False)
    debe = Column(Numeric(15, 2), default=0)
    haber = Column(Numeric(15, 2), default=0)
    descripcion = Column(String(300))

    asiento = relationship("Asiento", back_populates="lineas")
    cuenta = relationship("CuentaContable", back_populates="lineas")

