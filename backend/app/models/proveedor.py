from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class TipoDocProveedor(str, enum.Enum):
    cuit = "80"
    cuil = "86"
    dni = "96"
    extranjero = "89"


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    razon_social = Column(String, nullable=False)
    nombre_fantasia = Column(String)
    tipo_doc = Column(Enum(TipoDocProveedor), default=TipoDocProveedor.cuit)
    nro_doc = Column(String(13))
    condicion_iva = Column(String)
    email = Column(String)
    telefono = Column(String)
    contacto = Column(String)
    domicilio = Column(String)
    localidad = Column(String)
    provincia = Column(String)
    codigo_postal = Column(String(10))
    pais = Column(String, default="Argentina")
    condicion_pago = Column(String(50))
    cuenta_bancaria = Column(String)
    cbu = Column(String(22))
    alias_cbu = Column(String)
    notas = Column(String(1000))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="proveedores")
    compras = relationship("Compra", back_populates="proveedor")
