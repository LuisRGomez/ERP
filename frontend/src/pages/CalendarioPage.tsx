import { useState } from 'react'
import { Calendar, CheckCircle, Clock, AlertTriangle, DollarSign, FileText } from 'lucide-react'

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

type Categoria = 'IVA' | 'IIBB' | 'COBRO' | 'PAGO' | 'GANANCIAS' | 'VENCIMIENTO'

interface Evento {
  id: number
  fecha: string          // DD/MM/YYYY
  titulo: string
  descripcion: string
  categoria: Categoria
  monto?: number
  pagado: boolean
  diasRestantes: number
}

const categoriaCfg: Record<Categoria, { color: string; bg: string; icon: any; label: string }> = {
  IVA:        { color: 'text-red-700',     bg: 'bg-red-50 border-red-200',     icon: AlertTriangle, label: 'IVA AFIP' },
  IIBB:       { color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', icon: FileText,    label: 'IIBB' },
  COBRO:      { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: DollarSign, label: 'Cobro' },
  PAGO:       { color: 'text-brand-700',   bg: 'bg-brand-50 border-brand-200', icon: DollarSign,   label: 'Pago' },
  GANANCIAS:  { color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200', icon: FileText,   label: 'Ganancias' },
  VENCIMIENTO:{ color: 'text-gray-700',    bg: 'bg-gray-50 border-gray-200',   icon: Clock,         label: 'Vencimiento' },
}

const EVENTOS_MOCK: Evento[] = [
  { id:1,  fecha:'08/05/2026', titulo:'Vencimiento IVA — Abril 2026', descripcion:'DDJJ IVA mensual. CUIT term. 8-9', categoria:'IVA', monto:124300, pagado:false, diasRestantes:8 },
  { id:2,  fecha:'12/05/2026', titulo:'Vencimiento IIBB CABA', descripcion:'Ingresos Brutos CABA — Abril 2026', categoria:'IIBB', monto:18500, pagado:false, diasRestantes:12 },
  { id:3,  fecha:'15/05/2026', titulo:'Cobro factura ACME S.A.', descripcion:'FA 0001-00001234 — 30 días corridos', categoria:'COBRO', monto:180000, pagado:false, diasRestantes:15 },
  { id:4,  fecha:'20/05/2026', titulo:'Pago proveedor Tech Parts', descripcion:'Factura recibida N° B-0002-00000456', categoria:'PAGO', monto:95000, pagado:false, diasRestantes:20 },
  { id:5,  fecha:'22/05/2026', titulo:'Cobro Tech Solutions SRL', descripcion:'FA 0001-00001233 — Net 30', categoria:'COBRO', monto:95000, pagado:false, diasRestantes:22 },
  { id:6,  fecha:'28/05/2026', titulo:'Presentación balance trimestral', descripcion:'Cierre Q1 2026', categoria:'VENCIMIENTO', pagado:false, diasRestantes:28 },
  { id:7,  fecha:'05/06/2026', titulo:'Vencimiento IVA — Mayo 2026', descripcion:'DDJJ IVA mensual estimado', categoria:'IVA', monto:135000, pagado:false, diasRestantes:36 },
  { id:8,  fecha:'10/06/2026', titulo:'Vencimiento IIBB Santa Fe', descripcion:'Ingresos Brutos Santa Fe — Mayo 2026', categoria:'IIBB', monto:12400, pagado:false, diasRestantes:41 },
  { id:9,  fecha:'15/06/2026', titulo:'Cobro Distribuidora Norte', descripcion:'FA 0001-00001232 — 45 días', categoria:'COBRO', monto:230000, pagado:false, diasRestantes:46 },
  { id:10, fecha:'20/06/2026', titulo:'Pago alquiler oficina', descripcion:'Vencimiento mensual contrato', categoria:'PAGO', monto:85000, pagado:false, diasRestantes:51 },
  { id:11, fecha:'30/06/2026', titulo:'Cierre semestre — Ganancias estimado', descripcion:'Anticipo ganancias persona jurídica', categoria:'GANANCIAS', monto:280000, pagado:false, diasRestantes:61 },
  { id:12, fecha:'08/07/2026', titulo:'Vencimiento IVA — Junio 2026', descripcion:'DDJJ IVA mensual estimado', categoria:'IVA', monto:140000, pagado:false, diasRestantes:69 },
  // Vencidos (ya pasados)
  { id:13, fecha:'12/04/2026', titulo:'Vencimiento IVA — Marzo 2026', descripcion:'DDJJ IVA mensual', categoria:'IVA', monto:118900, pagado:true, diasRestantes:-18 },
  { id:14, fecha:'20/04/2026', titulo:'Pago proveedor Suministros SRL', descripcion:'Factura B-0001-00000312', categoria:'PAGO', monto:42000, pagado:true, diasRestantes:-10 },
]

const FILTROS: { key: Categoria | 'TODOS'; label: string }[] = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'IVA', label: 'IVA' },
  { key: 'IIBB', label: 'IIBB' },
  { key: 'COBRO', label: 'Cobros' },
  { key: 'PAGO', label: 'Pagos' },
  { key: 'GANANCIAS', label: 'Ganancias' },
]

export default function CalendarioPage() {
  const [filtro, setFiltro] = useState<Categoria | 'TODOS'>('TODOS')
  const [eventos, setEventos] = useState(EVENTOS_MOCK)

  const togglePagado = (id: number) =>
    setEventos((prev) => prev.map((e) => e.id === id ? { ...e, pagado: !e.pagado } : e))

  const filtrados = eventos
    .filter((e) => filtro === 'TODOS' || e.categoria === filtro)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)

  const proximos7 = filtrados.filter((e) => !e.pagado && e.diasRestantes >= 0 && e.diasRestantes <= 7)
  const pendientes = filtrados.filter((e) => !e.pagado && e.diasRestantes > 7)
  const vencidos   = filtrados.filter((e) => e.diasRestantes < 0 && !e.pagado)
  const pagados    = filtrados.filter((e) => e.pagado)

  const totalPendiente = filtrados.filter((e) => !e.pagado && e.monto).reduce((s, e) => s + (e.monto || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Fiscal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vencimientos impositivos y flujo de caja</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <AlertTriangle size={16} className="text-red-600" />
          <span className="text-sm font-semibold text-red-700">
            {proximos7.length + vencidos.length} alertas activas
          </span>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{proximos7.length + vencidos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Alertas activas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-700">{fmt(totalPendiente)}</p>
          <p className="text-sm text-gray-500 mt-1">Total pendiente</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-700">{pagados.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pagados / cumplidos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filtro === f.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Próximos 7 días */}
      {proximos7.length > 0 && (
        <Section title="⚠️ Próximos 7 días" eventos={proximos7} onToggle={togglePagado} urgent />
      )}

      {/* Vencidos */}
      {vencidos.length > 0 && (
        <Section title="🔴 Vencidos / No pagados" eventos={vencidos} onToggle={togglePagado} overdue />
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <Section title="📅 Próximos vencimientos" eventos={pendientes} onToggle={togglePagado} />
      )}

      {/* Pagados */}
      {pagados.length > 0 && (
        <Section title="✅ Completados" eventos={pagados} onToggle={togglePagado} done />
      )}
    </div>
  )
}

function Section({ title, eventos, onToggle, urgent, overdue, done }: {
  title: string; eventos: Evento[]; onToggle: (id: number) => void
  urgent?: boolean; overdue?: boolean; done?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-6 py-3 border-b border-gray-50 ${urgent ? 'bg-red-50' : overdue ? 'bg-orange-50' : done ? 'bg-gray-50' : ''}`}>
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {eventos.map((ev) => {
          const cfg = categoriaCfg[ev.categoria]
          const Icon = cfg.icon
          return (
            <div key={ev.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${done ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg}`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`font-semibold text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{ev.titulo}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{ev.descripcion}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-800">{ev.monto ? fmt(ev.monto) : '—'}</p>
                <p className={`text-xs mt-0.5 ${
                  ev.diasRestantes < 0 ? 'text-red-500' :
                  ev.diasRestantes <= 7 ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {ev.diasRestantes < 0
                    ? `Venció hace ${Math.abs(ev.diasRestantes)} días`
                    : ev.diasRestantes === 0 ? 'Vence HOY'
                    : `Vence en ${ev.diasRestantes} días`} — {ev.fecha}
                </p>
              </div>
              <button
                onClick={() => onToggle(ev.id)}
                className={`ml-2 p-2 rounded-lg transition-all ${
                  ev.pagado
                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    : 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50'
                }`}
                title={ev.pagado ? 'Marcar como pendiente' : 'Marcar como pagado'}
              >
                <CheckCircle size={20} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
