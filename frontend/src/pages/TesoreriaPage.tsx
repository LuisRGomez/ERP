import { useState } from 'react'
import { Plus, Landmark, TrendingUp, TrendingDown, ArrowLeftRight, RefreshCw } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { tesoreriaApi, type CuentaBancaria, type Cobro, type Pago } from '@/services/erp'

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const TIPO_CUENTA_BADGE: Record<string, string> = {
  BANCO:   'bg-blue-100 text-blue-700',
  CAJA:    'bg-amber-100 text-amber-700',
  VIRTUAL: 'bg-purple-100 text-purple-700',
}

export default function TesoreriaPage() {
  const [tab, setTab] = useState<'cuentas' | 'cobros' | 'pagos'>('cuentas')

  const cuentas = useQuery((eid) => tesoreriaApi.listarCuentas(eid))
  const cobros  = useQuery((eid) => tesoreriaApi.listarCobros(eid))
  const pagos   = useQuery((eid) => tesoreriaApi.listarPagos(eid))
  const resumen = useQuery((eid) => tesoreriaApi.resumen(eid))

  const totalCobros = resumen.data?.total_cobros ?? 0
  const totalPagos  = resumen.data?.total_pagos ?? 0
  const posicion    = resumen.data?.posicion_neta ?? 0

  const refetchAll = () => { cuentas.refetch(); cobros.refetch(); pagos.refetch(); resumen.refetch() }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tesorería</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cuentas bancarias, cobros y pagos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetchAll} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg">
            <RefreshCw size={15} />
          </button>
          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />Registrar movimiento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={18} className="text-blue-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Posición neta</p>
          </div>
          <p className={`text-2xl font-bold ${posicion >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {resumen.loading ? '…' : fmtARS(posicion)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{resumen.data?.total_cuentas ?? 0} cuentas activas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Cobros</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{cobros.loading ? '…' : fmtARS(totalCobros)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pagos</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{pagos.loading ? '…' : fmtARS(totalPagos)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-5">
        {(['cuentas', 'cobros', 'pagos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Cuentas */}
      {tab === 'cuentas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.loading
            ? <div className="col-span-3 py-12 text-center text-slate-400 text-sm">Cargando cuentas…</div>
            : (cuentas.data ?? []).map((c: CuentaBancaria) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{c.nombre}</p>
                    {c.banco && <p className="text-xs text-slate-400 mt-0.5">{c.banco}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_CUENTA_BADGE[c.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                    {c.tipo}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-2">{fmtARS(c.saldo_inicial)}</p>
                {c.alias && <p className="text-xs font-mono text-slate-400">{c.alias}</p>}
                {c.cbu && <p className="text-xs font-mono text-slate-300 mt-0.5 truncate">{c.cbu}</p>}
              </div>
            ))
          }
          <button className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
            <Plus size={20} /><span className="text-sm font-medium">Nueva cuenta</span>
          </button>
        </div>
      )}

      {/* Cobros */}
      {tab === 'cobros' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {cobros.loading
            ? <div className="py-12 text-center text-slate-400 text-sm">Cargando cobros…</div>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Forma de pago</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Referencia</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(cobros.data ?? []).map((c: Cobro) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{c.forma_pago ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.referencia ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{fmtARS(c.importe)}</td>
                    </tr>
                  ))}
                  {(cobros.data ?? []).length === 0 && (
                    <tr><td colSpan={3} className="py-10 text-center text-slate-400 text-sm">No hay cobros registrados</td></tr>
                  )}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* Pagos */}
      {tab === 'pagos' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {pagos.loading
            ? <div className="py-12 text-center text-slate-400 text-sm">Cargando pagos…</div>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Forma de pago</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Referencia</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(pagos.data ?? []).map((p: Pago) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{p.forma_pago ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.referencia ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500">{fmtARS(p.importe)}</td>
                    </tr>
                  ))}
                  {(pagos.data ?? []).length === 0 && (
                    <tr><td colSpan={3} className="py-10 text-center text-slate-400 text-sm">No hay pagos registrados</td></tr>
                  )}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  )
}
