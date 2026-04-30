import { useState } from 'react'
import { Plus, Search, Building2, Phone, Mail, CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { proveedoresApi, type Proveedor } from '@/services/erp'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/ui/Modal'
import api from '@/services/api'

const CONDICION_IVA_BADGE: Record<string, string> = {
  RI:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  MONO: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  EX:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  CF:   'bg-slate-50 text-slate-600 ring-1 ring-slate-200/60',
}

const EMPTY_FORM = {
  razon_social: '', nombre_fantasia: '', tipo_doc: 'CUIT', nro_doc: '',
  condicion_iva: 'RI', email: '', telefono: '', localidad: '', provincia: '',
  condicion_pago: '', cbu: '', alias_cbu: '', notas: '',
}

export default function ProveedoresPage() {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery(
    (eid) => proveedoresApi.listar(eid, soloActivos || undefined),
    [soloActivos],
  )

  const proveedores = (data ?? []).filter((p: Proveedor) =>
    p.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.nro_doc ?? '').includes(busqueda) ||
    (p.email ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.razon_social.trim()) { setFormError('La razón social es obligatoria'); return }
    setSaving(true); setFormError(null)
    try {
      await api.post('/proveedores/', { ...form, empresa_id: empresaId, pais: 'AR', activo: true })
      setOpen(false); setForm(EMPTY_FORM); refetch()
    } catch (e: any) {
      setFormError(e?.response?.data?.detail ?? 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">{loading ? '…' : `${proveedores.length} proveedores`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por razón social, CUIT o email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} className="rounded" />
          Solo activos
        </label>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Cargando proveedores…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Razón social</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CUIT</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">IVA</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Localidad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pago</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proveedores.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{p.razon_social}</div>
                    {p.nombre_fantasia && <div className="text-xs text-slate-400">{p.nombre_fantasia}</div>}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{p.nro_doc ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    {p.condicion_iva && (
                      <span className={`badge ${CONDICION_IVA_BADGE[p.condicion_iva] ?? 'bg-slate-50 text-slate-600'}`}>{p.condicion_iva}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      {p.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail size={11} />{p.email}</span>}
                      {p.telefono && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone size={11} />{p.telefono}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-sm">{p.localidad ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{p.condicion_pago ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    {p.activo
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={13} />Activo</span>
                      : <span className="flex items-center gap-1 text-xs text-slate-400"><XCircle size={13} />Inactivo</span>}
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-5 py-14 text-center">
                  <Building2 size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">No hay proveedores registrados</p>
                  <button onClick={() => setOpen(true)} className="mt-3 text-xs text-brand-600 hover:underline font-medium">+ Agregar proveedor</button>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proveedor" width="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Razón social *</label>
            <input value={form.razon_social} onChange={e => set('razon_social', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre fantasía</label>
            <input value={form.nombre_fantasia} onChange={e => set('nombre_fantasia', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CUIT</label>
            <input value={form.nro_doc} onChange={e => set('nro_doc', e.target.value)} placeholder="20-12345678-9"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Condición IVA</label>
            <select value={form.condicion_iva} onChange={e => set('condicion_iva', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="RI">Responsable Inscripto</option>
              <option value="MONO">Monotributista</option>
              <option value="EX">Exento</option>
              <option value="CF">Consumidor Final</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Condición de pago</label>
            <input value={form.condicion_pago} onChange={e => set('condicion_pago', e.target.value)} placeholder="Ej: 30 días"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} type="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Localidad</label>
            <input value={form.localidad} onChange={e => set('localidad', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CBU</label>
            <input value={form.cbu} onChange={e => set('cbu', e.target.value)} placeholder="22 dígitos"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alias CBU</label>
            <input value={form.alias_cbu} onChange={e => set('alias_cbu', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>
          {formError && <div className="col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{formError}</div>}
          <div className="col-span-2 flex gap-3 pt-1">
            <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar proveedor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
