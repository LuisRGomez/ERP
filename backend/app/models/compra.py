from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, ForeignKey, func, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class EstadoCompra(str, enum.Enum):
    borrador = "BORRADOR"
    registrada = "REGISTRADA"
    pagada = "PAGADA"
    anulada = "ANULADA"


class Compra(Base):
    __tablename__ = "compras"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    proveedor_id = Column(UUID(as_uuid=True), ForeignKey("proveedores.id"), nullable=True)

    # Datos del comprobante recibido
    tipo_comprobante = Column(String(10))   # FA, FB, FC, etc.
    punto_venta = Column(String(4))
    numero = Column(Integer)
    fecha = Column(DateTime(timezone=True))
    fecha_vencimiento = Column(Date, nullable=True)

    # Montos
    imp_neto = Column(Numeric(15, 2), default=0)
    imp_iva = Column(Numeric(15, 2), default=0)
    imp_total = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(3), default="PES")
    cotizacion = Column(Numeric(10, 4), default=1)

    # Retenciones
    ret_ganancias = Column(Numeric(15, 2), default=0)
    ret_iibb = Column(Numeric(15, 2), default=0)
    ret_iva = Column(Numeric(15, 2), default=0)
    percepciones = Column(Numeric(15, 2), default=0)

    # Items y alÃ­cuotas
    items = Column(JSON, default=list)
    alicuotas_iva = Column(JSON, default=list)

    condicion_pago = Column(String(50))
    observaciones = Column(Text)
    pdf_path = Column(String, nullable=True)
    stock_actualizado = Column(Boolean, default=False)

    estado = Column(Enum(EstadoCompra), default=EstadoCompra.borrador)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="compras")
    proveedor = relationship("Proveedor", back_populates="compras")
    pagos = relationship("Pago", back_populates="compra")

