from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    nombre = Column(String)
    activo = Column(Boolean, default=True)
    email_verificado = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresas = relationship("Empresa", back_populates="owner")
