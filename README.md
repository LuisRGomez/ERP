# FacturaSaaS

Plataforma SaaS de facturación electrónica para Argentina con integración ARCA (ex AFIP), diseñada para estudios contables y profesionales independientes.

> **Demo en vivo:** http://159.223.115.249 · **Repo:** https://github.com/LuisRGomez/factura-saas

---

## ✨ Funcionalidades actuales

### 🏢 Mis Empresas
- El contador gestiona **múltiples empresas clientes** desde una sola cuenta
- Cards por empresa con stats en tiempo real: comprobantes del mes, cantidad de clientes, punto de venta default
- Badge de estado de conexión ARCA (activo / sin ARCA)
- Modal de creación/edición con 3 tabs: **Datos generales**, **Fiscal**, **Domicilio**
- Toggle activo/inactivo, menú contextual (editar / desactivar / eliminar)
- Búsqueda por razón social, CUIT o nombre de fantasía
- Persistencia en localStorage (ready para backend)

### 📄 Comprobantes emitidos
- Emisión de **Facturas A / B / C / E**, Notas de Crédito y Débito
- Tabla con filtros por tipo, estado y búsqueda; sorting por fecha, cliente y total
- **Modal de detalle** (botón ojo): muestra emisor, receptor, ítems, totales desglosados, badge CAE
- Descargar PDF individual directamente desde la tabla
- Subir PDF externo por comprobante con feedback visual (✓ verde)
- Envío de email desde el modal de detalle

### ✏️ Nuevo comprobante — campos ARCA obligatorios
- Todos los campos requeridos desde abril 2025:
  - Período de servicio (`fch_serv_desde / fch_serv_hasta`) para concepto Servicios
  - Comprobante asociado (`cbte_asoc`) para NC y ND
  - `condicion_iva_receptor_id` numérico (1=RI / 4=EX / 5=CF / 6=MONO)
  - Array `AlicIva[]` con desglose por alícuota (0% / 2.5% / 5% / 10.5% / 21% / 27%)
  - Tipo de cambio para moneda extranjera (USD / EUR)
- Descuento por ítem y descuento global
- Código de producto, unidad de medida, condición de pago, N° orden de compra
- **Validación** tipo de comprobante vs. condición IVA del receptor
- **Generar PDF** (descarga inmediata) y **Guardar PDF** (sube al backend)
- Drop zone para adjuntar PDF externo

### 📑 PDF — layout oficial ARCA
- Caja de letra (A/B/C/E) con código ARCA centrado
- Datos empresa + receptor + bloque comprobante asociado (NC/ND)
- Tabla de ítems: código, descripción, UM, cantidad, precio, dto%, IVA, subtotal
- Totales desglosados por alícuota IVA
- Área CAE + placeholder QR (RG 4291/2018)
- Sello **BORRADOR** diagonal para comprobantes sin CAE

### 📥 Importación masiva
- Subí un CSV con **N comprobantes** y se procesan de una sola vez
- Drag & drop o selector de archivo (máx. 5 MB)
- **Plantilla CSV descargable** con 17 columnas ARCA y datos de ejemplo
- Validación fila por fila: tipo de comprobante, fecha, CUIT, importes
- Vista previa en tabla: estado por fila (Listo / Error / Advertencia / Importado)
- Expandir fila para ver detalle de cada error
- Filtros por estado + barra de progreso animada al importar

### 👥 Clientes
- CRUD completo — modal con **4 tabs**: Identificación, Contacto, Domicilio, Comercial
- Campos extendidos: razón social, CUIT/CUIL/DNI, condición IVA, email de facturación, contacto, domicilio estructurado (calle, localidad, provincia, CP, país), condición de pago, punto de venta default
- Filtros por condición IVA y estado; búsqueda full-text
- Tabla con localidad, POS default (badge monospace), condición de pago

### 📦 Productos y Servicios
- Catálogo para autocompletar ítems en comprobantes
- CRUD con código SKU, descripción, tipo (producto/servicio), unidad de medida, precio sin IVA, alícuota IVA
- Filtros por tipo, alícuota y estado

### 📊 Reportes
- **Resumen mensual:** KPI cards, BarChart 4 meses, PieChart por tipo, exportación
- **Libro IVA ventas:** tabla detallada con totales por alícuota
- **Posición IVA:** IVA ventas vs. compras, saldo a favor / deuda fiscal

### 📅 Calendario fiscal
- Vencimientos ARCA / AFIP, IIBB, retenciones, sueldos

### ⚙️ Configuración
- **Datos de empresa:** upload de logo con preview instantáneo (FileReader API)
- **Fiscal:** condición IVA, IIBB, régimen, actividad AFIP
- **Puntos de venta:** CRUD completo — número 4 dígitos, tipo (Web Services / Facturador Plus / Exportaciones), toggle activo/inactivo
- **ARCA:** upload `.crt` / `.key`, ambiente testing/producción, test de conexión
- **Email:** remitente, asunto, cuerpo con variables, notificaciones automáticas
- **Diseño de factura:** color principal, plantilla, pie de página, datos bancarios (CBU/alias)
- **Seguridad:** cambio de contraseña con show/hide, sesiones activas

---

## 🛠 Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS |
| Routing | React Router v6 |
| Forms | react-hook-form + useFieldArray |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| State | Zustand + persist (localStorage) |
| Backend | FastAPI (Python 3.11) · SQLAlchemy |
| Base de datos | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Cache | Redis |
| Storage | Local filesystem (`./storage/`) |
| ARCA | AfipSDK MVP → integración directa (v2) |

---

## 🗂 Estructura del proyecto

```
factura-saas/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # comprobantes, clientes, documentos, arca…
│   │   ├── models/              # Comprobante, Cliente, Empresa, Usuario
│   │   ├── core/                # config, security
│   │   └── db/                  # session, base
│   ├── storage/                 # PDFs subidos
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ComprobantesPage.tsx   # tabla + modal detalle
│   │   │   ├── NuevoComprobantePage.tsx
│   │   │   ├── RecibidosPage.tsx
│   │   │   ├── MisEmpresasPage.tsx    # multi-empresa para contadores
│   │   │   ├── ClientesPage.tsx       # CRUD con 4 tabs
│   │   │   ├── ProductosPage.tsx      # catálogo CRUD
│   │   │   ├── ImportacionPage.tsx    # importación masiva CSV
│   │   │   ├── ReportesPage.tsx
│   │   │   ├── KPIsPage.tsx
│   │   │   ├── CalendarioPage.tsx
│   │   │   └── ConfiguracionPage.tsx  # 7 secciones + PV CRUD
│   │   ├── components/layout/   # AppHeader, NavTabs, Layout
│   │   ├── utils/generarPDF.ts  # generador PDF layout oficial ARCA
│   │   └── stores/authStore.ts  # Zustand
│   └── package.json
├── docker-compose.yml
├── CHANGELOG.md
└── .env.example
```

---

## 🚀 Desarrollo local

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Variables de entorno (`.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost/facturasaas
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173
LOCAL_STORAGE_PATH=./storage
APP_ENV=development
```

---

## 🌐 Deployment (DigitalOcean)

| Item | Valor |
|------|-------|
| Servidor | 159.223.115.249 |
| Web | nginx → `/var/www/factura-saas/` |
| Frontend | build estático (Vite) |
| Backend | FastAPI uvicorn (puerto 8001) |

```bash
cd frontend && npm run build
# Los assets de dist/ se suben vía SFTP a /var/www/factura-saas/
```

---

## 🌿 Ramas Git

| Rama | Propósito |
|------|-----------|
| `master` | Producción estable |
| `dev` | Integración — todas las features se mergean acá primero |
| `feature/*` | Features individuales |

---

## 📋 Roadmap

- [ ] Integración ARCA real (WSAA + WSFEv1) con CAE
- [ ] QR real en PDF (RG 4291/2018)
- [ ] Envío de email con PDF adjunto (SMTP / SendGrid)
- [ ] Proveedores CRUD
- [ ] Catálogo de productos integrado al autocompletar en nuevo comprobante
- [ ] Presupuestos y conversión a factura
- [ ] Libro IVA exportación CSV / XLSX
- [ ] Multi-empresa en producción (ya soportado en UI)
- [ ] Importación CSV con validación real contra backend
- [ ] App móvil (React Native / PWA)

---

## 📄 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md)
