from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional, List
from app.db.session import get_db
from app.models.empresa import Empresa, CondicionIVA
from app.models.usuario import Usuario
from app.core.security import decode_token

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if not creds:
        raise HTTPException(401, "No autenticado")
    try:
        payload = decode_token(creds.credentials)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(401, "Token inválido")
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(401, "Usuario no encontrado")
    return user


class EmpresaIn(BaseModel):
    cuit: str
    razon_social: str
    nombre_fantasia: Optional[str] = None
    domicilio_fiscal: Optional[str] = None
    condicion_iva: CondicionIVA = CondicionIVA.responsable_inscripto


class EmpresaOut(BaseModel):
    id: str
    cuit: str
    razon_social: str
    nombre_fantasia: Optional[str] = None
    condicion_iva: str
    arca_habilitada: bool

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v)

    @field_validator("condicion_iva", mode="before")
    @classmethod
    def coerce_enum(cls, v):
        return v.value if hasattr(v, "value") else str(v)

    @field_validator("arca_habilitada", mode="before")
    @classmethod
    def coerce_bool(cls, v):
        return bool(v) if v is not None else False


@router.get("/", response_model=List[EmpresaOut])
def listar(
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Empresa).filter(Empresa.owner_id == current_user.id).offset(skip).limit(limit).all()


@router.post("/", response_model=EmpresaOut, status_code=201)
def crear(
    data: EmpresaIn,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = Empresa(**data.model_dump(), owner_id=str(current_user.id))
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.get("/{id}", response_model=EmpresaOut)
def obtener(id: str, db: Session = Depends(get_db)):
    e = db.query(Empresa).filter(Empresa.id == id).first()
    if not e:
        raise HTTPException(404, "Empresa no encontrada")
    return e
