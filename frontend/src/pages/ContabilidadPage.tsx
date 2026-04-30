import { useState } from 'react'
import { Plus, BookOpen, Scale, RefreshCw, ChevronRight } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { contabilidadApi, type CuentaContable, type Asiento } from '@/services/erp'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/ui/Modal'
import api from '@/services/api'

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const TIPO_COLOR: Record<string, string> = {
  ACTIVO:     'text-blue-600',
  PASIVO:     'text-red-600',
  PATRIMONIO: 'text-purple-600',
  INGRESO:    'text-emerald-600',
  EGRESO:     'text-orange-600',
}

const TIPO_BADGE: Record<string, string> = {
  ACTIVO:     'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  PASIVO:     'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  PATRIMONIO: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60',
  INGRESO:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  EGRESO:     'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60',
}

export default function ContabilidadPage() {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [tab, setTab] = useState<'plan' | 'diario'>('plan')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [openCuenta, setOpenCuenta] = useState(false)
  const [openAsiento, setOpenAsiento] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formCuenta, setFormCuenta] = useState({ codigo: '', nombre: '', tipo: 'ACTIVO', nivel: '1', descripcion: '' })
  const [formAsiento, setFormAsiento] = useState({ descripcion: '', debe_cuenta: '', debe_monto: '', haber_cuenta: '', haber_monto: '' })

  const cuentas  = useQuery((eid) => contabilidadApi.listarCuentas(eid))
  const asientos = useQuery((eid) => contabilidadApi.listarAsientos(eid))

  const cuentasFiltradas = (cuentas.data ?? []).filter((c: CuentaContable) =>
    filtroTipo === '' || c.tipo === filtroTipo
  )

  const totalDebe  = (asientos.data ?? []).reduce((s: number, a: Asiento) => s + a.total_debe, 0)
  const totalHaber = (asientos.data ?? []).reduce((s: number, a: Asiento) => s + a.total_haber, 0)

  const inicializarPlan = async () => {
    try {
      await api.post(`/contabilidad/cuentas/inicializar?empresa_id=${empresaId}`)
      cuentas.refetch()
    } catch {}
  }

  const saveCuenta = async () => {
    if (!formCuenta.codigo || !formCuenta.nombre) return
    setSaving(true)
    try {
      await api.post('/contabilidad/cuentas/', { ...formCuenta, empresa_id: empresaId, nivel: parseInt(formCuenta.nivel) || 1, activa: true })
      setOpenCuenta(false); setFormCuenta({ codigo: '', nombre: '', tipo: 'ACTIVO', nivel: '1', descripcion: '' }); cuentas.refetch()
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Contabilidad</h1>
          <p className="page-subtitle">Plan de cuentas y libro diario</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { cuentas.refetch(); asientos.refetch() }}
            className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
            <RefreshCw size={15} />
          </button>
          {tab === 'plan' && (cuentas.data ?? []).length === 0 && (
            <button onClick={inicializarPlan}
              className="flex items-center gap-2 border border-brand-300 text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              Inicializar plan básico
            </button>
          )}
          <button onClick={() => tab === 'plan' ? setOpenCuenta(true) : setOpenAsiento(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} />{tab === 'plan' ? 'Nueva cuenta' : 'Nuevo asiento'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Cuentas en el plan</p>
          <p className="text-3xl font-bold text-slate-900">{cuentas.loading ? '…' : (cuentas.data ?? []).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Total debe (período)</p>
          <p className="text-2xl font-bold text-blue-600">{asientos.loading ? '…' : fmtARS(totalDebe)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Total haber (período)</p>
          <p className="text-2xl font-bold text-emerald-600">{asientos.loading ? '…' : fmtARS(totalHaber)}</p>
          {!asientos.loading && Math.abs(totalDebe - totalHaber) > 0.01 && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <Scale size={11} />Desbalance: {fmtARS(Math.abs(totalDebe - totalHaber))}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([['plan', 'Plan de cuentas'], ['diario', 'Libro diario']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <>
          <div>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todos los tipos</option>
              {['ACTIVO','PASIVO','PATRIMONIO','INGRESO','EGRESO'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
            {cuentas.loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Cargando plan de cuentas…</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Código</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cuentasFiltradas.map((c: CuentaContable) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{c.codigo}</td>
                      <td className="py-2.5" style={{ paddingLeft: `${(c.nivel - 1) * 20 + 20}px`, paddingRight: '20px' }}>
                        <span className={c.nivel === 1 ? 'font-semibold text-slate-900' : c.nivel === 2 ? 'font-medium text-slate-700' : 'text-slate-500'}>
                          {c.nivel > 1 && <ChevronRight size={12} className="inline mr-1 text-slate-300" />}
                          {c.nombre}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`badge ${TIPO_BADGE[c.tipo] ?? 'bg-slate-50 text-slate-600'}`}>{c.tipo}</span>
                      </td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{c.nivel}</td>
                    </tr>
                  ))}
                  {cuentasFiltradas.length === 0 && !cuentas.loading && (
                    <tr><td colSpan={4} className="py-14 text-center">
                      <BookOpen size={28} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">Sin plan de cuentas.</p>
                      <button onClick={inicializarPlan} className="mt-3 text-xs text-brand-600 hover:underline font-medium">Inicializar plan básico</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'diario' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          {asientos.loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Cargando asientos…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">N°</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Origen</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Debe</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(asientos.data ?? []).map((a: Asiento) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">#{a.numero}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{String(a.fecha).substring(0, 10)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{a.descripcion}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{a.origen ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-blue-600">{fmtARS(a.total_debe)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{fmtARS(a.total_haber)}</td>
                  </tr>
                ))}
                {(asientos.data ?? []).length === 0 && (
                  <tr><td colSpan={6} className="py-14 text-center">
                    <Scale size={28} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">No hay asientos contables</p>
                    <button onClick={() => setOpenAsiento(true)} className="mt-3 text-xs text-brand-600 hover:underline font-medium">+ Nuevo asiento</button>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal nueva cuenta */}
      <Modal open={openCuenta} onClose={() => setOpenCuenta(false)} title="Nueva cuenta contable">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código *</label>
              <input value={formCuenta.codigo} onChange={e => setFormCuenta(f => ({...f, codigo: e.target.value}))} placeholder="Ej: 1.1.01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel</label>
              <select value={formCuenta.nivel} onChange={e => setFormCuenta(f => ({...f, nivel: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="1">1 — Rubro</option>
                <option value="2">2 — Cuenta</option>
                <option value="3">3 — Subcuenta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
            <input value={formCuenta.nombre} onChange={e => setFormCuenta(f => ({...f, nombre: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select value={formCuenta.tipo} onChange={e => setFormCuenta(f => ({...f, tipo: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="ACTIVO">Activo</option>
              <option value="PASIVO">Pasivo</option>
              <option value="PATRIMONIO">Patrimonio</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setOpenCuenta(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={saveCuenta} disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cuenta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal nuevo asiento */}
      <Modal open={openAsiento} onClose={() => setOpenAsiento(false)} title="Nuevo asiento contable">
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            El debe y el haber deben ser iguales para que el asiento cierre.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
            <input value={formAsiento.descripcion} onChange={e => setFormAsiento(f => ({...f, descripcion: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-xl">
            <p className="col-span-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">DEBE</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cuenta</label>
              <select value={formAsiento.debe_cuenta} onChange={e => setFormAsiento(f => ({...f, debe_cuenta: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar…</option>
                {(cuentas.data ?? []).map((c: CuentaContable) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
              <input value={formAsiento.debe_monto} onChange={e => setFormAsiento(f => ({...f, debe_monto: e.target.value}))} type="number" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50/50 rounded-xl">
            <p className="col-span-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide">HABER</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cuenta</label>
              <select value={formAsiento.haber_cuenta} onChange={e => setFormAsiento(f => ({...f, haber_cuenta: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar…</option>
                {(cuentas.data ?? []).map((c: CuentaContable) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
              <input value={formAsiento.haber_monto} onChange={e => setFormAsiento(f => ({...f, haber_monto: e.target.value}))} type="number" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setOpenAsiento(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={async () => {
              if (!formAsiento.descripcion || !formAsiento.debe_monto) return
              setSaving(true)
              try {
                const monto = parseFloat(formAsiento.debe_monto) || 0
                await api.post('/contabilidad/asientos/', {
                  empresa_id: empresaId,
                  descripcion: formAsiento.descripcion,
                  lineas: [
                    { cuenta_id: formAsiento.debe_cuenta, debe: monto, haber: 0 },
                    { cuenta_id: formAsiento.haber_cuenta, debe: 0, haber: parseFloat(formAsiento.haber_monto) || monto },
                  ]
                })
                setOpenAsiento(false); asientos.refetch()
              } catch {} finally { setSaving(false) }
            }} disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Registrar asiento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
