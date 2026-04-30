from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class CondicionIVA(str, enum.Enum):
    responsable_inscripto = "RI"
    monotributista = "MONO"
    exento = "EX"
    consumidor_final = "CF"


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    cuit = Column(String(13), unique=True, nullable=False, index=True)
    razon_social = Column(String, nullable=False)
    nombre_fantasia = Column(String)
    domicilio_fiscal = Column(String)
    condicion_iva = Column(Enum(CondicionIVA), nullable=False)
    # ARCA config
    punto_venta = Column(String(4))
    cert_alias = Column(String)
    arca_habilitada = Column(Boolean, default=False)
    # Plan
    plan_id = Column(String, default="free")
    comprobantes_mes = Column(String, default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("Usuario", back_populates="empresas")
    clientes = relationship("Cliente", back_populates="empresa")
    comprobantes = relationship("Comprobante", back_populates="empresa")
    proveedores = relationship("Proveedor", back_populates="empresa")
    compras = relationship("Compra", back_populates="empresa")
    productos = relationship("Producto", back_populates="empresa")
    cuentas_bancarias = relationship("CuentaBancaria", back_populates="empresa")
    cobros = relationship("Cobro", back_populates="empresa")
    pagos = relationship("Pago", back_populates="empresa")
    presupuestos = relationship("Presupuesto", back_populates="empresa")
    remitos = relationship("Remito", back_populates="empresa")
    cuentas_contables = relationship("CuentaContable", back_populates="empresa")
    asientos = relationship("Asiento", back_populates="empresa")
    empleados = relationship("Empleado", back_populates="empresa")
