# Changelog

Todos los cambios notables de FacturaSaaS se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

---

## [0.5.0] — 2026-04-30

### Added
- **MisEmpresasPage** — gestión multi-empresa para contadores
  - Cards por empresa con stats: comprobantes del mes, clientes, punto de venta default
  - Badge de conexión ARCA (activo / sin ARCA)
  - Modal de creación/edición con 3 tabs: Datos generales, Fiscal, Domicilio
  - Toggle activo/inactivo, menú contextual (editar / desactivar / eliminar)
  - Búsqueda por razón social, CUIT o nombre de fantasía
  - Persistencia en localStorage
- **ImportacionPage** — importación masiva de comprobantes por CSV
  - Drop zone drag & drop + file picker
  - Plantilla CSV descargable con datos de ejemplo (17 columnas ARCA)
  - Parser CSV con validación de campos: tipo, fecha, CUIT, importes
  - Vista previa en tabla con estado por fila (Listo / Error / Advertencia / Importado)
  - Expandir fila para ver detalle de errores
  - Filtros por estado, barra de progreso animada durante importación
  - Panel lateral con columnas requeridas y tips
- **ConfiguracionPage — Puntos de Venta** — nueva sección CRUD
  - Tabla de puntos de venta con tipo (Web Services / Facturador Plus / Exportaciones)
  - Toggle activo/inactivo inline
  - Modal crear/editar con validación de número 4 dígitos
  - Persistencia en localStorage
- **NavTabs** — nuevas pestañas: Mis Empresas, Importar
- **ClientesPage** — reescritura completa
  - Modal 4 tabs: Identificación, Contacto, Domicilio, Comercial
  - Nuevos campos: email_facturacion, calle, localidad, provincia, cp, país, condicion_pago, pto_venta_default
  - Tabla actualizada con localidad, POS default monospace badge, condición pago

---

## [0.4.0] — 2026-04-30

### Added
- **ProductosPage** — CRUD completo de catálogo de productos y servicios
  - Código SKU, descripción, tipo (producto/servicio), unidad de medida
  - Precio unitario y alícuota IVA por ítem
  - Filtros por tipo, alícuota y estado; búsqueda por código/descripción
  - Modal crear/editar + confirmación de eliminación
- **ConfiguracionPage** — uploads funcionales
  - Logo de empresa: file input con preview instantáneo (FileReader API)
  - Certificado ARCA `.crt`: muestra nombre del archivo al cargar
  - Clave privada `.key`: muestra nombre del archivo al cargar
  - Persistencia de datos en localStorage (simula backend)
- **README.md** — reescritura completa con todas las funcionalidades actuales
- **CHANGELOG.md** — este archivo

### Fixed
- ConfiguracionPage: el logo placeholder ahora activa correctamente el input de archivo
- Los botones "Subir .crt / .key" eran decorativos; ahora tienen inputs funcionales

---

## [0.3.0] — 2026-04-30

### Added
- **generarPDF.ts** — generador de PDF con layout oficial ARCA
  - Caja de letra (A/B/C/E) + código ARCA centrado
  - Secciones empresa, receptor, tabla ítems, totales desglosados por alícuota
  - Área CAE + placeholder QR (RG 4291/2018)
  - Sello BORRADOR diagonal para comprobantes sin CAE
- **NuevoComprobantePage** — todos los campos obligatorios ARCA
  - Período de servicio (aparece solo si concepto = Servicios/Ambos)
  - Comprobante asociado — tipo, pto. venta, número (aparece para NC/ND)
  - Tipo de cambio (aparece si moneda ≠ ARS)
  - Descuento por ítem (columna %) + descuento global (%)
  - Código de producto y unidad de medida por ítem
  - Condición de pago (contado / 30 / 60 / 90 días)
  - N° orden de compra
  - Totales desglosados: Neto XX% / IVA XX% por cada alícuota usada
  - Validación: advertencia si tipo/condición IVA del receptor no coinciden
  - Botón "Generar PDF" → descarga inmediata
  - Botón "Guardar PDF" → sube al backend
  - Drop zone para adjuntar PDF externo
- **ComprobantesPage** — acciones por fila
  - Botón descargar PDF (genera desde datos del comprobante)
  - Botón subir PDF externo con feedback visual (✓ verde al completar)
- **Backend — documentos.py** — nuevo endpoint
  - `POST /api/v1/documentos/upload` — multipart, máx. 10 MB, PDF/JPG/PNG
  - `GET /api/v1/documentos/archivo/{tipo}/{empresa_id}/{filename}` — serve file
  - `DELETE /api/v1/documentos/archivo/...` — eliminar y desvincular
- **Backend — comprobante.py** — nuevos campos en el modelo
  - `cbte_asoc_tipo`, `cbte_asoc_pto_vta`, `cbte_asoc_nro`
  - `fch_serv_desde`, `fch_serv_hasta`
  - `condicion_iva_receptor_id` (obligatorio ARCA desde abr. 2025)
  - `descuento_global`, `condicion_pago`, `orden_compra`, `observaciones`
  - `uploaded_pdf_path` (para PDFs subidos externamente)

---

## [0.2.0] — 2026-04-28

### Added
- **Rediseño de layout** — gradient header azul + tabs horizontales pill (sin sidebar)
- **AppHeader** — logo, selector de empresa (3 mock), campana, menú usuario
- **NavTabs** — 8 tabs: Dashboard, Emitidos, Recibidos, Clientes, KPIs, Calendario, Reportes, Configuración
- **ComprobantesPage** — tabla completa
  - 15 comprobantes mock (FA/FB/FC/FE/NCA/NDA)
  - Filtros: búsqueda, tipo, estado
  - Sorting por fecha, cliente, total
  - Stats row: total facturado, NC, emitidos
  - Acciones: ver, descargar, enviar email
- **NuevoComprobantePage** — mejoras
  - Selector de clientes con CUIT y condición IVA visible
  - Fecha con default hoy, punto de venta
  - Selector de moneda, tipos NC/ND
  - Botones: Guardar borrador + Emitir
- **ReportesPage** — 3 tabs
  - Resumen: KPI cards, BarChart facturación 4 meses, PieChart por tipo, exportación
  - Libro IVA: tabla completa con tfoot de totales
  - Posición IVA: caja de saldo a favor / deuda fiscal
- **ConfiguracionPage** — 6 secciones
  - Empresa, Fiscal, ARCA (con test de conexión), Email, Diseño, Seguridad

### Changed
- Eliminado sidebar vertical → reemplazado por AppHeader + NavTabs
- Topbar.tsx vaciado (legacy, mantiene compatibilidad)

---

## [0.1.0] — 2026-04-25

### Added
- Scaffold inicial del proyecto
- **Backend FastAPI**
  - Modelos: Usuario, Empresa, Comprobante (FA/FB/FC/FE + NC/ND), Cliente
  - Endpoints: auth (login/register/refresh), empresas, clientes, comprobantes, reportes
  - JWT con access token (30 min) + refresh token (7 días)
  - CORS configurado para frontend local
- **Frontend React + Vite**
  - Zustand authStore con persist en localStorage
  - React Router v6 con PrivateRoute
  - LandingPage, LoginPage, RegisterPage, OnboardingPage
  - DashboardPage con KPIs y gráficos Recharts
  - ClientesPage con CRUD modal completo
  - KPIsPage con indicadores financieros
  - CalendarioPage con vencimientos fiscales
  - RecibidosPage — listado de comprobantes recibidos
- Tailwind CSS con token `brand-600` (#2563eb)
- docker-compose.yml (PostgreSQL + Redis)
- .env.example
