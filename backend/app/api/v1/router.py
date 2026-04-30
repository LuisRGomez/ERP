from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, empresas, clientes, comprobantes, reportes, arca, documentos,
    proveedores, inventario, compras, tesoreria, presupuestos,
    contabilidad, rrhh,
)

api_router = APIRouter()

api_router.include_router(auth.router,          prefix="/auth",          tags=["auth"])
api_router.include_router(empresas.router,      prefix="/empresas",      tags=["empresas"])
api_router.include_router(clientes.router,      prefix="/clientes",      tags=["clientes"])
api_router.include_router(comprobantes.router,  prefix="/comprobantes",  tags=["comprobantes"])
api_router.include_router(reportes.router,      prefix="/reportes",      tags=["reportes"])
api_router.include_router(arca.router,          prefix="/arca",          tags=["arca"])
api_router.include_router(documentos.router,    prefix="/documentos",    tags=["documentos"])
api_router.include_router(proveedores.router,   prefix="/proveedores",   tags=["proveedores"])
api_router.include_router(inventario.router,    prefix="/inventario",    tags=["inventario"])
api_router.include_router(compras.router,       prefix="/compras",       tags=["compras"])
api_router.include_router(tesoreria.router,     prefix="/tesoreria",     tags=["tesoreria"])
api_router.include_router(presupuestos.router,  prefix="/presupuestos",  tags=["presupuestos"])
api_router.include_router(contabilidad.router,  prefix="/contabilidad",  tags=["contabilidad"])
api_router.include_router(rrhh.router,          prefix="/rrhh",          tags=["rrhh"])
