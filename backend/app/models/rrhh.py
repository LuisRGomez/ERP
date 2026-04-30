from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, ForeignKey, func, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class ModalidadContrato(str, enum.Enum):
    relacion_dependencia = "DEPENDENCIA"
    monotributo = "MONOTRIBUTO"
    autonomo = "AUTONOMO"
    pasante = "PASANTE"


class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    cuil = Column(String(13))
    dni = Column(String(8))
    email = Column(String)
    telefono = Column(String)
    domicilio = Column(String)
    fecha_nacimiento = Column(Date, nullable=True)
    fecha_ingreso = Column(Date, nullable=True)
    fecha_egreso = Column(Date, nullable=True)
    puesto = Column(String(100))
    departamento = Column(String(100))
    modalidad = Column(Enum(ModalidadContrato), default=ModalidadContrato.relacion_dependencia)
    salario_bruto = Column(Numeric(15, 2), default=0)
    cbu = Column(String(22))
    alias_cbu = Column(String)
    obra_social = Column(String(100))
    nro_afiliado_os = Column(String(50))
    notas = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", back_populates="empleados")
