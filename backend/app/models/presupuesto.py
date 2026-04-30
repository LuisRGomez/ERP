from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, ForeignKey, func, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class EstadoPresupuesto(str, enum.Enum):
    borrador = "BORRADOR"
    enviado = "ENVIADO"
    aceptado = "ACEPTADO"
    rechazado = "RECHAZADO"
    vencido = "VENCIDO"
    facturado = "FACTURADO"


class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=True)

    numero = Column(Integer)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    fecha_vencimiento = Column(Date, nullable=True)

    # Items (mismo formato que comprobantes)
    items = Column(JSONB, default=list)
    imp_neto = Column(Numeric(15, 2), default=0)
    imp_iva = Column(Numeric(15, 2), default=0)
    imp_total = Column(Numeric(15, 2), default=0)
    descuento_global = Column(Numeric(5, 2), default=0)
    moneda = Column(String(3), default="PES")
    cotizacion = Column(Numeric(10, 4), default=1)

    condicion_pago = Column(String(50))
    validez_dias = Column(Integer, default=30)
    notas = Column(Text)
    estado = Column(Enum(EstadoPresupuesto), default=EstadoPresupuesto.borrador)

    # Si fue convertido a factura
    comprobante_id = Column(UUID(as_uuid=True), ForeignKey("comprobantes.id"), nullable=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="presupuestos")
    cliente = relationship("Cliente")
    comprobante = relationship("Comprobante")


class Remito(Base):
    __tablename__ = "remitos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=True)

    numero = Column(Integer)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    items = Column(JSONB, default=list)
    deposito_origen = Column(String(100))
    domicilio_entrega = Column(String(500))
    transportista = Column(String(200))
    observaciones = Column(Text)

    # Si está asociado a un comprobante
    comprobante_id = Column(UUID(as_uuid=True), ForeignKey("comprobantes.id"), nullable=True)
    pdf_path = Column(String, nullable=True)
    entregado = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="remitos")
    cliente = relationship("Cliente")
    comprobante = relationship("Comprobante")
