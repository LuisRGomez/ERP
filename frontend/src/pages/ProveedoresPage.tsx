import { useState } from 'react'
import { Plus, Search, Building2, Phone, Mail, CreditCard, MoreVertical, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { proveedoresApi, type Proveedor } from '@/services/erp'
import { useAuthStore } from '@/stores/authStore'

const CONDICION_IVA_BADGE: Record<string, string> = {
  RI:   'bg-blue-100 text-blue-700',
  MONO: 'bg-emerald-100 text-emerald-700',
  EX:   'bg-amber-100 text-amber-700',
  CF:   'bg-slate-100 text-slate-600',
}

export default function ProveedoresPage() {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)

  const { data, loading, error, refetch } = useQuery(
    (eid) => proveedoresApi.listar(eid, soloActivos || undefined),
    [soloActivos],
  )

  const proveedores = (data ?? []).filter((p: Proveedor) =>
    p.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.nro_doc ?? '').includes(busqueda) ||
    (p.email ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? '…' : `${proveedores.length} proveedores`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg">
            <RefreshCw size={15} />
          </button>
          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por razón social, CUIT o email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} className="rounded" />
          Solo activos
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Cargando proveedores…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Razón social</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">CUIT</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">IVA</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Contacto</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Localidad</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Pago</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">CBU / Alias</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.razon_social}</div>
                    {p.nombre_fantasia && <div className="text-xs text-slate-400">{p.nombre_fantasia}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{p.nro_doc ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.condicion_iva && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDICION_IVA_BADGE[p.condicion_iva] ?? 'bg-slate-100 text-slate-600'}`}>
                        {p.condicion_iva}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {p.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail size={11} />{p.email}</span>}
                      {p.telefono && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone size={11} />{p.telefono}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.localidad ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{p.condicion_pago ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.alias_cbu
                      ? <span className="flex items-center gap-1 text-xs font-mono text-slate-700"><CreditCard size={11} />{p.alias_cbu}</span>
                      : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.activo
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={13} />Activo</span>
                      : <span className="flex items-center gap-1 text-xs text-slate-400"><XCircle size={13} />Inactivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-slate-400 hover:text-slate-700 p-1 rounded"><MoreVertical size={15} /></button>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                    No hay proveedores registrados
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
