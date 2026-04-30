from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.comprobante import Comprobante, EstadoComprobante

router = APIRouter()


@router.get("/resumen")
def resumen(empresa_id: str, mes: int, anio: int, db: Session = Depends(get_db)):
    base = db.query(Comprobante).filter(
        Comprobante.empresa_id == empresa_id,
        Comprobante.estado == EstadoComprobante.emitido,
        func.extract("month", Comprobante.fecha) == mes,
        func.extract("year", Comprobante.fecha) == anio,
    )
    total = base.with_entities(func.sum(Comprobante.imp_total)).scalar() or 0
    cantidad = base.count()
    return {"mes": mes, "anio": anio, "total_facturado": float(total), "cantidad_comprobantes": cantidad}
