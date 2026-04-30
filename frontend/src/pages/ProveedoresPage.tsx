import { useState } from 'react'
import { Plus, Search, Building2, Phone, Mail, CreditCard, MoreVertical, CheckCircle, XCircle } from 'lucide-react'

type Proveedor = {
  id: string
  razon_social: string
  nombre_fantasia?: string
  nro_doc?: string
  condicion_iva?: string
  email?: string
  telefono?: string
  localidad?: string
  condicion_pago?: string
  cbu?: string
  alias_cbu?: string
  activo: boolean
}

const MOCK: Proveedor[] = [
  { id: '1', razon_social: 'Distribuidora Norte SA', nro_doc: '30-12345678-9', condicion_iva: 'RI', email: 'ventas@norte.com', telefono: '011-4444-5555', localidad: 'Buenos Aires', condicion_pago: '30 días', cbu: '0070999030000001234567', alias_cbu: 'NORTE.DIST', activo: true },
  { id: '2', razon_social: 'Servicios Tech SRL', nro_doc: '33-98765432-1', condicion_iva: 'RI', email: 'admin@tech.com', telefono: '011-5555-6666', localidad: 'Córdoba', condicion_pago: 'Contado', activo: true },
  { id: '3', razon_social: 'Papelería Central', nro_doc: '20-45678901-2', condicion_iva: 'MONO', email: 'papeleria@gmail.com', localidad: 'Rosario', condicion_pago: '15 días', activo: false },
]

const CONDICION_IVA_BADGE: Record<string, string> = {
  RI: 'bg-blue-100 text-blue-700',
  MONO: 'bg-emerald-100 text-emerald-700',
  EX: 'bg-amber-100 text-amber-700',
  CF: 'bg-slate-100 text-slate-600',
}

export default function ProveedoresPage() {
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)

  const proveedores = MOCK.filter(p =>
    (soloActivos ? p.activo : true) &&
    (p.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
     (p.nro_doc || '').includes(busqueda) ||
     (p.email || '').toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{proveedores.length} proveedores</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por razón social, CUIT o email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} className="rounded" />
          Solo activos
        </label>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
                <td className="px-4 py-3 font-mono text-slate-600 text-xs">{p.nro_doc || '—'}</td>
                <td className="px-4 py-3">
                  {p.condicion_iva && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDICION_IVA_BADGE[p.condicion_iva] || 'bg-slate-100 text-slate-600'}`}>
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
                <td className="px-4 py-3 text-slate-600">{p.localidad || '—'}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{p.condicion_pago || '—'}</td>
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
                  <button className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors">
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                  No hay proveedores que coincidan con la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
