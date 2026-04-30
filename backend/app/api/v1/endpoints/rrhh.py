from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.models.rrhh import Empleado, ModalidadContrato

router = APIRouter()


class EmpleadoIn(BaseModel):
    empresa_id: str
    nombre: str
    apellido: str
    cuil: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    domicilio: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    fecha_ingreso: Optional[str] = None
    puesto: Optional[str] = None
    departamento: Optional[str] = None
    modalidad: ModalidadContrato = ModalidadContrato.relacion_dependencia
    salario_bruto: float = 0
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    obra_social: Optional[str] = None
    nro_afiliado_os: Optional[str] = None
    notas: Optional[str] = None


class EmpleadoOut(BaseModel):
    id: str
    nombre: str
    apellido: str
    cuil: Optional[str]
    email: Optional[str]
    telefono: Optional[str]
    puesto: Optional[str]
    departamento: Optional[str]
    fecha_ingreso: Optional[str]
    modalidad: str
    salario_bruto: float
    obra_social: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


@router.get("/empleados", response_model=List[EmpleadoOut])
def listar(empresa_id: str, activo: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(Empleado).filter(Empleado.empresa_id == empresa_id)
    if activo is not None:
        q = q.filter(Empleado.activo == activo)
    return q.order_by(Empleado.apellido, Empleado.nombre).all()


@router.post("/empleados", response_model=EmpleadoOut, status_code=201)
def crear(data: EmpleadoIn, db: Session = Depends(get_db)):
    e = Empleado(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.get("/empleados/{empleado_id}", response_model=EmpleadoOut)
def obtener(empleado_id: str, db: Session = Depends(get_db)):
    e = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not e:
        raise HTTPException(404, "Empleado no encontrado")
    return e


@router.put("/empleados/{empleado_id}", response_model=EmpleadoOut)
def actualizar(empleado_id: str, data: EmpleadoIn, db: Session = Depends(get_db)):
    e = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not e:
        raise HTTPException(404, "Empleado no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return e


@router.delete("/empleados/{empleado_id}", status_code=204)
def dar_baja(empleado_id: str, db: Session = Depends(get_db)):
    e = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not e:
        raise HTTPException(404, "Empleado no encontrado")
    e.activo = False
    db.commit()


@router.get("/resumen")
def resumen(empresa_id: str, db: Session = Depends(get_db)):
    total = db.query(Empleado).filter(Empleado.empresa_id == empresa_id, Empleado.activo == True).count()
    from sqlalchemy import func
    masa_salarial = db.query(func.sum(Empleado.salario_bruto)).filter(
        Empleado.empresa_id == empresa_id, Empleado.activo == True
    ).scalar() or 0
    return {"total_empleados": total, "masa_salarial_bruta": float(masa_salarial)}
