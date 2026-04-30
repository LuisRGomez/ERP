from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, func, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class TipoCuenta(str, enum.Enum):
    banco = "BANCO"
    caja = "CAJA"
    virtual = "VIRTUAL"   # MercadoPago, Ualá, etc.


class TipoMovTesoria(str, enum.Enum):
    cobro = "COBRO"
    pago = "PAGO"
    transferencia = "TRANSFERENCIA"
    ajuste = "AJUSTE"


class CuentaBancaria(Base):
    __tablename__ = "cuentas_bancarias"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    nombre = Column(String, nullable=False)
    tipo = Column(Enum(TipoCuenta), default=TipoCuenta.banco)
    banco = Column(String)
    numero_cuenta = Column(String)
    cbu = Column(String(22))
    alias = Column(String)
    moneda = Column(String(3), default="ARS")
    saldo_inicial = Column(Numeric(15, 2), default=0)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="cuentas_bancarias")
    movimientos = relationship("MovimientoTesoreria", back_populates="cuenta")


class MovimientoTesoreria(Base):
    __tablename__ = "movimientos_tesoreria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    cuenta_id = Column(UUID(as_uuid=True), ForeignKey("cuentas_bancarias.id"), nullable=False)

    tipo = Column(Enum(TipoMovTesoria), nullable=False)
    importe = Column(Numeric(15, 2), nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    concepto = Column(String(500))
    referencia = Column(String(200))    # nro cheque, transferencia, etc.
    origen = Column(String(50))         # "cobro", "pago", "manual"
    origen_id = Column(UUID(as_uuid=True), nullable=True)
    conciliado = Column(Boolean, default=False)

    cuenta = relationship("CuentaBancaria", back_populates="movimientos")


class Cobro(Base):
    __tablename__ = "cobros"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=True)
    cuenta_id = Column(UUID(as_uuid=True), ForeignKey("cuentas_bancarias.id"), nullable=True)
    comprobante_id = Column(UUID(as_uuid=True), ForeignKey("comprobantes.id"), nullable=True)

    fecha = Column(DateTime(timezone=True), server_default=func.now())
    importe = Column(Numeric(15, 2), nullable=False)
    forma_pago = Column(String(50))      # efectivo, cheque, transferencia, tarjeta
    referencia = Column(String(200))
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="cobros")
    cliente = relationship("Cliente")


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    proveedor_id = Column(UUID(as_uuid=True), ForeignKey("proveedores.id"), nullable=True)
    cuenta_id = Column(UUID(as_uuid=True), ForeignKey("cuentas_bancarias.id"), nullable=True)
    compra_id = Column(UUID(as_uuid=True), ForeignKey("compras.id"), nullable=True)

    fecha = Column(DateTime(timezone=True), server_default=func.now())
    importe = Column(Numeric(15, 2), nullable=False)
    forma_pago = Column(String(50))
    referencia = Column(String(200))
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="pagos")
    proveedor = relationship("Proveedor")
    compra = relationship("Compra", back_populates="pagos")
