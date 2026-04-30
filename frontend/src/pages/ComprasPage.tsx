import { useState } from 'react'
import { Plus, Search, ShoppingCart, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

type Compra = {
  id: string
  proveedor: string
  tipo_comprobante?: string
  numero?: number
  fecha: string
  imp_total: number
  moneda: string
  ret_ganancias: number
  ret_iibb: number
  estado: 'BORRADOR' | 'REGISTRADA' | 'PAGADA' | 'ANULADA'
}

const MOCK: Compra[] = [
  { id: '1', proveedor: 'Distribuidora Norte SA', tipo_comprobante: 'FA', numero: 1042, fecha: '2025-04-15', imp_total: 145200, moneda: 'PES', ret_ganancias: 5808, ret_iibb: 2904, estado: 'REGISTRADA' },
  { id: '2', proveedor: 'Servicios Tech SRL', tipo_comprobante: 'FA', numero: 88, fecha: '2025-04-10', imp_total: 102850, moneda: 'PES', ret_ganancias: 4114, ret_iibb: 2057, estado: 'PAGADA' },
  { id: '3', proveedor: 'Papelería Central', tipo_comprobante: 'FC', numero: 210, fecha: '2025-04-05', imp_total: 18500, moneda: 'PES', ret_ganancias: 0, ret_iibb: 0, estado: 'BORRADOR' },
]

const ESTADO_CONFIG = {
  BORRADOR:   { icon: Clock,        color: 'text-slate-500', bg: 'bg-slate-100',  label: 'Borrador' },
  REGISTRADA: { icon: CheckCircle,  color: 'text-blue-600',  bg: 'bg-blue-50',    label: 'Registrada' },
  PAGADA:     { icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Pagada' },
  ANULADA:    { icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50',     label: 'Anulada' },
}

const fmtARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function ComprasPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const compras = MOCK.filter(c =>
    (filtroEstado === '' || c.estado === filtroEstado) &&
    c.proveedor.toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalMes = MOCK.filter(c => c.estado !== 'ANULADA').reduce((s, c) => s + c.imp_total, 0)
  const pendPago = MOCK.filter(c => c.estado === 'REGISTRADA').reduce((s, c) => s + c.imp_total, 0)
  const totalRetGan = MOCK.reduce((s, c) => s + c.ret_ganancias, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compras</h1>
          <p className="text-sm text-slate-500 mt-0.5">Facturas recibidas y control de pagos</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Registrar compra
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total del mes', value: fmtARS(totalMes), sub: `${MOCK.length} comprobantes`, color: 'text-slate-900' },
          { label: 'Pendiente de pago', value: fmtARS(pendPago), sub: `${MOCK.filter(c => c.estado === 'REGISTRADA').length} facturas`, color: 'text-amber-600' },
          { label: 'Ret. Ganancias acum.', value: fmtARS(totalRetGan), sub: 'mes actual', color: 'text-blue-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
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
            placeholder="Buscar proveedor..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="REGISTRADA">Registrada</option>
          <option value="PAGADA">Pagada</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Comprobante</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Ret. Ganancias</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Ret. IIBB</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {compras.map(c => {
              const cfg = ESTADO_CONFIG[c.estado]
              const Icon = cfg.icon
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.proveedor}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {c.tipo_comprobante} {c.numero?.toString().padStart(8, '0')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.fecha}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtARS(c.imp_total)}</td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {c.ret_ganancias > 0 ? `- ${fmtARS(c.ret_ganancias)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {c.ret_iibb > 0 ? `- ${fmtARS(c.ret_iibb)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-600 hover:underline font-medium">Ver</button>
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
