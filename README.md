# ERP — Sistema de Gestión Empresarial

ERP completo para Argentina: ventas, compras, inventario, tesorería, contabilidad y RRHH. Facturación electrónica con ARCA (ex AFIP) integrada.

**Repo:** https://github.com/LuisRGomez/ERP

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Ventas** | Comprobantes ARCA (A/B/C/M), presupuestos, remitos, clientes |
| **Compras** | Facturas de proveedores, retenciones (ganancias, IIBB, IVA) |
| **Inventario** | Productos, stock por depósito, movimientos, alertas stock mínimo |
| **Tesorería** | Cuentas bancarias, cobros, pagos, saldo en tiempo real |
| **Contabilidad** | Plan de cuentas, libro diario, asientos automáticos |
| **RRHH** | Legajos de empleados, masa salarial |
| **Multi-empresa** | Gestioná múltiples CUITs desde una sola cuenta |

---

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Auth:** JWT (access + refresh tokens)
- **PDF:** WeasyPrint (comprobantes y remitos)

---

## Levantar en local

### Requisitos
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8002
```

La base de datos SQLite (`erp.db`) se crea sola al primer arranque.

### Frontend
```bash
cd frontend
npm install
npm run dev                   # corre en http://localhost:5173
```

### Script de arranque (Windows)
```powershell
.\start.ps1
```

---

## Variables de entorno

Crear `backend/.env`:

```env
DATABASE_URL=sqlite:///./erp.db
SECRET_KEY=cambia-esto-por-algo-seguro
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ARCA (ex AFIP) — opcional para dev local
AFIP_CERT=
AFIP_KEY=
AFIP_CUIT=
```

---

## Estructura del proyecto

```
ERP/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # proveedores, inventario, compras, tesoreria...
│   │   ├── models/             # SQLAlchemy ORM
│   │   ├── core/               # config, auth, security
│   │   └── db/                 # session, base
│   ├── requirements.txt
│   └── requirements-dev.txt    # sin psycopg2 (SQLite local)
├── frontend/
│   ├── src/
│   │   ├── pages/              # una página por módulo
│   │   ├── components/layout/  # Sidebar, AppHeader, Layout
│   │   ├── services/erp.ts     # capa de API tipada
│   │   └── hooks/useErp.ts     # hooks genéricos useQuery/useMutation
│   └── vite.config.ts
├── start.ps1                   # arranca backend + frontend
├── docker-compose.yml          # para producción
└── .gitignore
```

---

## Endpoints principales

```
GET  /api/v1/health
POST /api/v1/auth/register
POST /api/v1/auth/login

GET/POST /api/v1/proveedores/
GET/POST /api/v1/inventario/productos/
GET/POST /api/v1/compras/
GET/POST /api/v1/tesoreria/cuentas/
GET      /api/v1/tesoreria/resumen/
GET/POST /api/v1/presupuestos/
GET/POST /api/v1/contabilidad/plan-cuentas/
POST     /api/v1/contabilidad/plan-cuentas/inicializar/
GET/POST /api/v1/rrhh/empleados/
```

---

## Deploy con Docker

```bash
docker compose up -d
```

Levanta backend (FastAPI), frontend (Nginx) y PostgreSQL. Ver `docker-compose.yml`.
