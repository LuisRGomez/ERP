from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, ForeignKey, func, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class TipoComprobante(str, enum.Enum):
    factura_a = "FA"
    factura_b = "FB"
    factura_c = "FC"
    factura_e = "FE"
    nd_a = "NDA"
    nd_b = "NDB"
    nc_a = "NCA"
    nc_b = "NCB"
    nc_c = "NCC"


class EstadoComprobante(str, enum.Enum):
    borrador = "BORRADOR"
    pendiente = "PENDIENTE"    # esperando CAE de ARCA
    emitido = "EMITIDO"        # tiene CAE
    error = "ERROR"
    anulado = "ANULADO"


class Comprobante(Base):
    __tablename__ = "comprobantes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id"))

    tipo = Column(Enum(TipoComprobante), nullable=False)
    numero = Column(Integer)
    punto_venta = Column(String(4))
    fecha = Column(DateTime(timezone=True))
    concepto = Column(Integer, default=2)  # 1=productos 2=servicios 3=ambos

    # Período de servicio (obligatorio si concepto 2 o 3)
    fch_serv_desde = Column(Date, nullable=True)
    fch_serv_hasta = Column(Date, nullable=True)

    # Comprobante asociado (obligatorio para NC y ND)
    cbte_asoc_tipo = Column(Integer, nullable=True)
    cbte_asoc_pto_vta = Column(Integer, nullable=True)
    cbte_asoc_nro = Column(Integer, nullable=True)

    # Condición IVA receptor (obligatorio desde abril 2025)
    # 1=RI, 4=Exento, 5=CF, 6=Monotributo
    condicion_iva_receptor_id = Column(Integer, nullable=True)

    # Montos
    imp_neto = Column(Numeric(15, 2), default=0)
    imp_iva = Column(Numeric(15, 2), default=0)
    imp_total = Column(Numeric(15, 2), nullable=False)
    descuento_global = Column(Numeric(5, 2), default=0)  # % descuento sobre neto
    moneda = Column(String(3), default="PES")
    cotizacion = Column(Numeric(10, 4), default=1)

    # Items y alícuotas desglosadas (JSON flexible)
    items = Column(JSONB, default=list)
    # [{alicuota: 21, base_imp: 1000.00, importe: 210.00}, ...]
    alicuotas_iva = Column(JSONB, default=list)

    # Referencia comercial
    condicion_pago = Column(String(50), nullable=True)
    orden_compra = Column(String(100), nullable=True)
    observaciones = Column(String(500), nullable=True)

    # ARCA
    cae = Column(String(14))
    cae_vencimiento = Column(DateTime(timezone=True))
    estado = Column(Enum(EstadoComprobante), default=EstadoComprobante.borrador)
    arca_response = Column(JSONB)

    # PDF: pdf_path = generado por el sistema / uploaded_pdf_path = subido por el contador
    pdf_path = Column(String, nullable=True)
    uploaded_pdf_path = Column(String, nullable=True)
    email_enviado = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="comprobantes")
    cliente = relationship("Cliente", back_populates="comprobantes")
