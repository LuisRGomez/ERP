import { useState } from 'react'
import { Plus, Search, ShoppingCart, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { comprasApi, type Compra } from '@/services/erp'

const ESTADO_CONFIG = {
  BORRADOR:   { icon: Clock,       color: 'text-slate-500',   bg: 'bg-slate-100',   label: 'Borrador' },
  REGISTRADA: { icon: CheckCircle, color: 'text-blue-600',    bg: 'bg-blue-50',     label: 'Registrada' },
  PAGADA:     { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'Pagada' },
  ANULADA:    { icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50',      label: 'Anulada' },
} as const

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function ComprasPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const { data, loading, error, refetch } = useQuery(
    (eid) => comprasApi.listar(eid, filtroEstado || undefined),
    [filtroEstado],
  )

  const compras = (data ?? []).filter((c: Compra) =>
    !busqueda || (c.tipo_comprobante ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalMes = compras.filter(c => c.estado !== 'ANULADA').reduce((s, c) => s + c.imp_total, 0)
  const pendPago = compras.filter(c => c.estado === 'REGISTRADA').reduce((s, c) => s + c.imp_total, 0)
  const totalRetGan = compras.reduce((s, c) => s + c.ret_ganancias, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compras</h1>
          <p className="text-sm text-slate-500 mt-0.5">Facturas recibidas y control de pagos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg">
            <RefreshCw size={15} />
          </button>
          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />Registrar compra
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total del período', value: fmtARS(totalMes), sub: `${compras.length} comprobantes`, color: 'text-slate-900' },
          { label: 'Pendiente de pago', value: fmtARS(pendPago), sub: `${compras.filter(c => c.estado === 'REGISTRADA').length} facturas`, color: 'text-amber-600' },
          { label: 'Ret. Ganancias acum.', value: fmtARS(totalRetGan), sub: 'período actual', color: 'text-blue-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{loading ? '—' : k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Cargando compras…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Comprobante</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Ret. Ganancias</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Ret. IIBB</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compras.map(c => {
                const cfg = ESTADO_CONFIG[c.estado as keyof typeof ESTADO_CONFIG]
                const Icon = cfg?.icon ?? Clock
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {c.tipo_comprobante} {c.numero?.toString().padStart(8, '0') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtARS(c.imp_total)}</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {c.ret_ganancias > 0 ? `- ${fmtARS(c.ret_ganancias)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {c.ret_iibb > 0 ? `- ${fmtARS(c.ret_iibb)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {cfg && (
                        <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <Icon size={12} />{cfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-brand-600 hover:underline font-medium">Ver</button>
                    </td>
                  </tr>
                )
              })}
              {compras.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                    No hay compras registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
