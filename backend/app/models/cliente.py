from sqlalchemy import Column, String, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class TipoDocumento(str, enum.Enum):
    cuit = "80"
    cuil = "86"
    dni = "96"
    consumidor_final = "99"


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    razon_social = Column(String, nullable=False)
    tipo_doc = Column(Enum(TipoDocumento), default=TipoDocumento.cuit)
    nro_doc = Column(String(13))
    email = Column(String)
    telefono = Column(String)
    domicilio = Column(String)
    condicion_iva = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="clientes")
    comprobantes = relationship("Comprobante", back_populates="cliente")
