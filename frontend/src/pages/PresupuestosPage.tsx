import { useState } from 'react'
import { Plus, Search, FileCheck, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

type Presupuesto = {
  id: string
  numero: number
  cliente: string
  fecha: string
  vencimiento: string
  imp_total: number
  moneda: string
  estado: 'BORRADOR' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'VENCIDO' | 'FACTURADO'
  items: number
}

const MOCK: Presupuesto[] = [
  { id: '1', numero: 42, cliente: 'Empresa ABC SA', fecha: '2025-04-25', vencimiento: '2025-05-25', imp_total: 285000, moneda: 'ARS', estado: 'ENVIADO', items: 3 },
  { id: '2', numero: 41, cliente: 'Comercial XYZ', fecha: '2025-04-20', vencimiento: '2025-05-20', imp_total: 145000, moneda: 'ARS', estado: 'ACEPTADO', items: 5 },
  { id: '3', numero: 40, cliente: 'Industrias Del Sur', fecha: '2025-04-10', vencimiento: '2025-04-25', imp_total: 520000, moneda: 'USD', estado: 'VENCIDO', items: 8 },
  { id: '4', numero: 39, cliente: 'Comercial XYZ', fecha: '2025-03-28', vencimiento: '2025-04-28', imp_total: 95000, moneda: 'ARS', estado: 'FACTURADO', items: 2 },
]

const ESTADO_CONFIG = {
  BORRADOR:  { color: 'text-slate-500',   bg: 'bg-slate-100',   label: 'Borrador' },
  ENVIADO:   { color: 'text-blue-600',    bg: 'bg-blue-50',     label: 'Enviado' },
  ACEPTADO:  { color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'Aceptado' },
  RECHAZADO: { color: 'text-red-500',     bg: 'bg-red-50',      label: 'Rechazado' },
  VENCIDO:   { color: 'text-amber-600',   bg: 'bg-amber-50',    label: 'Vencido' },
  FACTURADO: { color: 'text-purple-600',  bg: 'bg-purple-50',   label: 'Facturado' },
}

const fmtNum = (n: number, moneda: string) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda === 'USD' ? 'USD' : 'ARS', maximumFractionDigits: 0 }).format(n)

export default function PresupuestosPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const items = MOCK.filter(p =>
    (filtroEstado === '' || p.estado === filtroEstado) &&
    p.cliente.toLowerCase().includes(busqueda.toLowerCase())
  )

  const pendientes = MOCK.filter(p => p.estado === 'ENVIADO').length
  const aceptados = MOCK.filter(p => p.estado === 'ACEPTADO').length
  const tasaConversion = MOCK.length > 0
    ? Math.round((MOCK.filter(p => ['ACEPTADO', 'FACTURADO'].includes(p.estado)).length / MOCK.length) * 100)
    : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuestos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cotizaciones y conversión a facturas</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Nuevo presupuesto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendientes de respuesta', value: pendientes, color: 'text-blue-600' },
          { label: 'Aceptados (listos a facturar)', value: aceptados, color: 'text-emerald-600' },
          { label: 'Tasa de conversión', value: `${tasaConversion}%`, color: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">N°</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Vencimiento</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Items</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(p => {
              const cfg = ESTADO_CONFIG[p.estado]
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">#{p.numero.toString().padStart(4, '0')}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.cliente}</td>
                  <td className="px-4 py-3 text-slate-500">{p.fecha}</td>
                  <td className="px-4 py-3 text-slate-500">{p.vencimiento}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{p.items}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtNum(p.imp_total, p.moneda)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-slate-500 hover:text-slate-700">Ver</button>
                      {p.estado === 'ACEPTADO' && (
                        <button className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <ArrowRight size={11} />
                          Facturar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
