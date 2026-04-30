import { useState } from 'react'
import { Plus, BookOpen, Scale, RefreshCw, ChevronRight } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { contabilidadApi, type CuentaContable, type Asiento } from '@/services/erp'
import { useAuthStore } from '@/stores/authStore'

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const TIPO_COLOR: Record<string, string> = {
  ACTIVO:      'text-blue-600',
  PASIVO:      'text-red-600',
  PATRIMONIO:  'text-purple-600',
  INGRESO:     'text-emerald-600',
  EGRESO:      'text-orange-600',
}

export default function ContabilidadPage() {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [tab, setTab] = useState<'plan' | 'diario'>('plan')
  const [filtroTipo, setFiltroTipo] = useState('')

  const cuentas  = useQuery((eid) => contabilidadApi.listarCuentas(eid))
  const asientos = useQuery((eid) => contabilidadApi.listarAsientos(eid))

  const cuentasFiltradas = (cuentas.data ?? []).filter((c: CuentaContable) =>
    filtroTipo === '' || c.tipo === filtroTipo
  )

  const totalDebe  = (asientos.data ?? []).reduce((s: number, a: Asiento) => s + a.total_debe, 0)
  const totalHaber = (asientos.data ?? []).reduce((s: number, a: Asiento) => s + a.total_haber, 0)

  const inicializarPlan = async () => {
    try {
      await fetch(`/api/v1/contabilidad/cuentas/inicializar?empresa_id=${empresaId}`, { method: 'POST' })
      cuentas.refetch()
    } catch {}
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contabilidad</h1>
          <p className="text-sm text-slate-500 mt-0.5">Plan de cuentas y libro diario</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { cuentas.refetch(); asientos.refetch() }}
            className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg">
            <RefreshCw size={15} />
          </button>
          {tab === 'plan' && (cuentas.data ?? []).length === 0 && (
            <button onClick={inicializarPlan}
              className="flex items-center gap-2 border border-brand-400 text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-lg text-sm font-medium">
              Inicializar plan básico
            </button>
          )}
          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />{tab === 'plan' ? 'Nueva cuenta' : 'Nuevo asiento'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cuentas en el plan</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{cuentas.loading ? '…' : (cuentas.data ?? []).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total debe (período)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{asientos.loading ? '…' : fmtARS(totalDebe)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total haber (período)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{asientos.loading ? '…' : fmtARS(totalHaber)}</p>
          {!asientos.loading && Math.abs(totalDebe - totalHaber) > 0.01 && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <Scale size={11} />Desbalance: {fmtARS(Math.abs(totalDebe - totalHaber))}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-5">
        {([['plan', 'Plan de cuentas'], ['diario', 'Libro diario']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Plan de cuentas */}
      {tab === 'plan' && (
        <>
          <div className="flex gap-3 mb-4">
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
              <option value="">Todos los tipos</option>
              {['ACTIVO','PASIVO','PATRIMONIO','INGRESO','EGRESO'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {cuentas.loading
              ? <div className="py-12 text-center text-slate-400 text-sm">Cargando plan de cuentas…</div>
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Código</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Nivel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuentasFiltradas.map((c: CuentaContable) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{c.codigo}</td>
                        <td className="px-4 py-2.5" style={{ paddingLeft: `${(c.nivel - 1) * 20 + 16}px` }}>
                          <span className={c.nivel === 1 ? 'font-semibold text-slate-900' : c.nivel === 2 ? 'font-medium text-slate-700' : 'text-slate-600'}>
                            {c.nivel > 1 && <ChevronRight size={12} className="inline mr-1 text-slate-300" />}
                            {c.nombre}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium ${TIPO_COLOR[c.tipo] ?? 'text-slate-500'}`}>{c.tipo}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{c.nivel}</td>
                      </tr>
                    ))}
                    {cuentasFiltradas.length === 0 && !cuentas.loading && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                          Sin plan de cuentas. Hacé clic en "Inicializar plan básico".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}

      {/* Libro diario */}
      {tab === 'diario' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {asientos.loading
            ? <div className="py-12 text-center text-slate-400 text-sm">Cargando asientos…</div>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">N°</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Descripción</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Origen</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Debe</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(asientos.data ?? []).map((a: Asiento) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">#{a.numero}</td>
                      <td className="px-4 py-3 text-slate-500">{String(a.fecha).substring(0, 10)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{a.descripcion}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{a.origen ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{fmtARS(a.total_debe)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{fmtARS(a.total_haber)}</td>
                    </tr>
                  ))}
                  {(asientos.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Scale size={32} className="mx-auto mb-2 opacity-30" />
                        No hay asientos contables registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  )
}
