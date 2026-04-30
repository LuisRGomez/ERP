import { useState } from 'react'
import { Plus, Landmark, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { tesoreriaApi, type CuentaBancaria, type Cobro, type Pago } from '@/services/erp'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/ui/Modal'
import api from '@/services/api'

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const TIPO_BADGE: Record<string, string> = {
  BANCO:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  CAJA:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  VIRTUAL: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60',
}

export default function TesoreriaPage() {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [tab, setTab] = useState<'cuentas' | 'cobros' | 'pagos'>('cuentas')
  const [openCuenta, setOpenCuenta] = useState(false)
  const [openMovimiento, setOpenMovimiento] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formCuenta, setFormCuenta] = useState({ nombre: '', tipo: 'BANCO', banco: '', numero_cuenta: '', cbu: '', alias: '', moneda: 'ARS', saldo_inicial: '0' })
  const [formCobro, setFormCobro] = useState({ importe: '', forma_pago: 'transferencia', referencia: '', observaciones: '' })
  const [formPago, setFormPago] = useState({ importe: '', forma_pago: 'transferencia', referencia: '', observaciones: '' })

  const cuentas = useQuery((eid) => tesoreriaApi.listarCuentas(eid))
  const cobros  = useQuery((eid) => tesoreriaApi.listarCobros(eid))
  const pagos   = useQuery((eid) => tesoreriaApi.listarPagos(eid))
  const resumen = useQuery((eid) => tesoreriaApi.resumen(eid))

  const posicion    = resumen.data?.posicion_neta ?? 0
  const totalCobros = (cobros.data ?? []).reduce((s: number, c: Cobro) => s + c.importe, 0)
  const totalPagos  = (pagos.data ?? []).reduce((s: number, p: Pago) => s + p.importe, 0)

  const refetchAll = () => { cuentas.refetch(); cobros.refetch(); pagos.refetch(); resumen.refetch() }

  const saveCuenta = async () => {
    setSaving(true)
    try {
      await api.post('/tesoreria/cuentas/', { ...formCuenta, empresa_id: empresaId, saldo_inicial: parseFloat(formCuenta.saldo_inicial) || 0, activo: true })
      setOpenCuenta(false); setFormCuenta({ nombre: '', tipo: 'BANCO', banco: '', numero_cuenta: '', cbu: '', alias: '', moneda: 'ARS', saldo_inicial: '0' }); refetchAll()
    } catch {} finally { setSaving(false) }
  }

  const saveCobro = async () => {
    if (!formCobro.importe) return
    setSaving(true)
    try {
      await api.post('/tesoreria/cobros/', { ...formCobro, empresa_id: empresaId, importe: parseFloat(formCobro.importe) })
      setOpenMovimiento(false); setFormCobro({ importe: '', forma_pago: 'transferencia', referencia: '', observaciones: '' }); refetchAll()
    } catch {} finally { setSaving(false) }
  }

  const savePago = async () => {
    if (!formPago.importe) return
    setSaving(true)
    try {
      await api.post('/tesoreria/pagos/', { ...formPago, empresa_id: empresaId, importe: parseFloat(formPago.importe) })
      setOpenMovimiento(false); setFormPago({ importe: '', forma_pago: 'transferencia', referencia: '', observaciones: '' }); refetchAll()
    } catch {} finally { setSaving(false) }
  }

  const [tipoMov, setTipoMov] = useState<'cobro' | 'pago'>('cobro')

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Tesorería</h1>
          <p className="page-subtitle">Cuentas, cobros y pagos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetchAll} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setOpenMovimiento(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> Registrar movimiento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Landmark size={15} className="text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Posición neta</p>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${posicion >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {resumen.loading ? '…' : fmtARS(posicion)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{resumen.data?.total_cuentas ?? 0} cuentas activas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cobros</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-600">{cobros.loading ? '…' : fmtARS(totalCobros)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown size={15} className="text-red-500" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pagos</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-red-500">{pagos.loading ? '…' : fmtARS(totalPagos)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['cuentas', 'cobros', 'pagos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'cuentas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.loading
            ? <div className="col-span-3 py-12 text-center text-slate-400 text-sm">Cargando cuentas…</div>
            : (cuentas.data ?? []).map((c: CuentaBancaria) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{c.nombre}</p>
                    {c.banco && <p className="text-xs text-slate-400 mt-0.5">{c.banco}</p>}
                  </div>
                  <span className={`badge ${TIPO_BADGE[c.tipo] ?? 'bg-slate-50 text-slate-600'}`}>{c.tipo}</span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 mb-2">{fmtARS(c.saldo_inicial)}</p>
                {c.alias && <p className="text-xs font-mono text-slate-400">{c.alias}</p>}
              </div>
            ))
          }
          <button onClick={() => setOpenCuenta(true)}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors min-h-[140px]">
            <Plus size={20} />
            <span className="text-sm font-medium">Nueva cuenta</span>
          </button>
        </div>
      )}

      {tab === 'cobros' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Forma de pago</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Referencia</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(cobros.data ?? []).map((c: Cobro) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-slate-700 capitalize">{c.forma_pago ?? '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{c.referencia ?? '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{fmtARS(c.importe)}</td>
                </tr>
              ))}
              {(cobros.data ?? []).length === 0 && (
                <tr><td colSpan={3} className="py-12 text-center text-slate-400 text-sm">No hay cobros registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pagos' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Forma de pago</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Referencia</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(pagos.data ?? []).map((p: Pago) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-slate-700 capitalize">{p.forma_pago ?? '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{p.referencia ?? '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-red-500">{fmtARS(p.importe)}</td>
                </tr>
              ))}
              {(pagos.data ?? []).length === 0 && (
                <tr><td colSpan={3} className="py-12 text-center text-slate-400 text-sm">No hay pagos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva cuenta */}
      <Modal open={openCuenta} onClose={() => setOpenCuenta(false)} title="Nueva cuenta bancaria">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input value={formCuenta.nombre} onChange={e => setFormCuenta(f => ({...f, nombre: e.target.value}))} placeholder="Ej: Banco Galicia"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
              <select value={formCuenta.tipo} onChange={e => setFormCuenta(f => ({...f, tipo: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="BANCO">Banco</option>
                <option value="CAJA">Caja</option>
                <option value="VIRTUAL">Virtual (MP, Ualá…)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Banco</label>
              <input value={formCuenta.banco} onChange={e => setFormCuenta(f => ({...f, banco: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CBU</label>
              <input value={formCuenta.cbu} onChange={e => setFormCuenta(f => ({...f, cbu: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alias</label>
              <input value={formCuenta.alias} onChange={e => setFormCuenta(f => ({...f, alias: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Saldo inicial</label>
              <input value={formCuenta.saldo_inicial} onChange={e => setFormCuenta(f => ({...f, saldo_inicial: e.target.value}))} type="number"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setOpenCuenta(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={saveCuenta} disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cuenta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal movimiento */}
      <Modal open={openMovimiento} onClose={() => setOpenMovimiento(false)} title="Registrar movimiento">
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {(['cobro', 'pago'] as const).map(t => (
              <button key={t} onClick={() => setTipoMov(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tipoMov === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
          {tipoMov === 'cobro' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Importe *</label>
                <input value={formCobro.importe} onChange={e => setFormCobro(f => ({...f, importe: e.target.value}))} type="number" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de pago</label>
                <select value={formCobro.forma_pago} onChange={e => setFormCobro(f => ({...f, forma_pago: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Referencia</label>
                <input value={formCobro.referencia} onChange={e => setFormCobro(f => ({...f, referencia: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setOpenMovimiento(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={saveCobro} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Registrar cobro'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Importe *</label>
                <input value={formPago.importe} onChange={e => setFormPago(f => ({...f, importe: e.target.value}))} type="number" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de pago</label>
                <select value={formPago.forma_pago} onChange={e => setFormPago(f => ({...f, forma_pago: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Referencia</label>
                <input value={formPago.referencia} onChange={e => setFormPago(f => ({...f, referencia: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setOpenMovimiento(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={savePago} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Registrar pago'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
