import { useState } from 'react'
import {
  Building2, Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
  ChevronRight, Search, X, Save, Globe, Receipt, Users,
  FileText, MoreHorizontal,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Empresa {
  id: number
  razon_social: string
  nombre_fantasia: string
  cuit: string
  condicion_iva: 'RI' | 'MONO' | 'EX' | 'CF'
  domicilio: string
  localidad: string
  provincia: string
  email: string
  telefono: string
  actividades: string        // código AFIP
  ingresos_brutos: string
  regimen: string
  punto_venta_default: string
  activo: boolean
  logo_url?: string
  comprobantes_mes: number
  clientes: number
  ultima_factura?: string    // fecha ISO
  arca_conectado: boolean
}

const CONDICION_IVA: Record<string, string> = {
  RI: 'Resp. Inscripto', MONO: 'Monotributista', EX: 'Exento', CF: 'Cons. Final',
}

const LS_KEY = 'facturasaas_empresas'
const loadEmpresas = (): Empresa[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
const saveEmpresas = (data: Empresa[]) => localStorage.setItem(LS_KEY, JSON.stringify(data))

const MOCK: Empresa[] = [
  {
    id: 1, razon_social: 'Tecnología Aplicada S.A.', nombre_fantasia: 'TecnoApp',
    cuit: '30-71234567-8', condicion_iva: 'RI', domicilio: 'Av. Corrientes 1234 Piso 3',
    localidad: 'CABA', provincia: 'Buenos Aires', email: 'admin@tecnoapp.com',
    telefono: '+54 11 4321-0000', actividades: '620100', ingresos_brutos: '902-123456-7',
    regimen: 'general', punto_venta_default: '0001', activo: true,
    comprobantes_mes: 47, clientes: 23, ultima_factura: '2026-04-29', arca_conectado: true,
  },
  {
    id: 2, razon_social: 'Estudio Contable Rodríguez', nombre_fantasia: '',
    cuit: '20-25678901-3', condicion_iva: 'MONO', domicilio: 'Calle Lavalle 890',
    localidad: 'Rosario', provincia: 'Santa Fe', email: 'info@estudiorodriguez.com',
    telefono: '+54 341 555-1234', actividades: '692000', ingresos_brutos: '301-987654-3',
    regimen: 'simplificado', punto_venta_default: '0001', activo: true,
    comprobantes_mes: 18, clientes: 9, ultima_factura: '2026-04-28', arca_conectado: false,
  },
  {
    id: 3, razon_social: 'Importadora El Sol S.R.L.', nombre_fantasia: 'El Sol Importaciones',
    cuit: '30-65432109-7', condicion_iva: 'RI', domicilio: 'Ruta 9 km 1240, Galpón B',
    localidad: 'Córdoba', provincia: 'Córdoba', email: 'ventas@elsol.com.ar',
    telefono: '+54 351 444-5678', actividades: '469000', ingresos_brutos: '130-456789-0',
    regimen: 'general', punto_venta_default: '0002', activo: false,
    comprobantes_mes: 0, clientes: 45, ultima_factura: '2026-03-14', arca_conectado: false,
  },
]

const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-white'

const EMPTY_FORM: Omit<Empresa, 'id' | 'comprobantes_mes' | 'clientes' | 'ultima_factura'> = {
  razon_social: '', nombre_fantasia: '', cuit: '', condicion_iva: 'RI',
  domicilio: '', localidad: '', provincia: 'Buenos Aires', email: '', telefono: '',
  actividades: '', ingresos_brutos: '', regimen: 'general', punto_venta_default: '0001',
  activo: true, arca_conectado: false,
}

export default function MisEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>(() => {
    const s = loadEmpresas()
    return s.length ? s : MOCK
  })
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState<{ open: boolean; editing: Empresa | null }>({ open: false, editing: null })
  const [form, setForm]             = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [activeTab, setActiveTab]   = useState<'datos' | 'fiscal' | 'domicilio'>('datos')
  const [saved, setSaved]           = useState(false)
  const [menuId, setMenuId]         = useState<number | null>(null)

  const filtered = empresas.filter(e =>
    e.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    e.cuit.includes(search) ||
    (e.nombre_fantasia || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setActiveTab('datos')
    setModal({ open: true, editing: null })
  }

  const openEdit = (emp: Empresa) => {
    const { id, comprobantes_mes, clientes, ultima_factura, ...rest } = emp
    setForm(rest)
    setActiveTab('datos')
    setModal({ open: true, editing: emp })
    setMenuId(null)
  }

  const saveModal = () => {
    if (!form.razon_social.trim() || !form.cuit.trim()) return
    let updated: Empresa[]
    if (modal.editing) {
      updated = empresas.map(e => e.id === modal.editing!.id ? {
        ...modal.editing!, ...form,
      } : e)
    } else {
      const newId = Math.max(0, ...empresas.map(e => e.id)) + 1
      updated = [...empresas, {
        id: newId, ...form,
        comprobantes_mes: 0, clientes: 0, arca_conectado: false,
      }]
    }
    setEmpresas(updated)
    saveEmpresas(updated)
    setModal({ open: false, editing: null })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const deleteEmpresa = (id: number) => {
    const updated = empresas.filter(e => e.id !== id)
    setEmpresas(updated)
    saveEmpresas(updated)
    setDeleteId(null)
  }

  const toggleActivo = (id: number) => {
    const updated = empresas.map(e => e.id === id ? { ...e, activo: !e.activo } : e)
    setEmpresas(updated)
    saveEmpresas(updated)
    setMenuId(null)
  }

  // Stats totales
  const totalFacturasMes  = empresas.filter(e => e.activo).reduce((a, b) => a + b.comprobantes_mes, 0)
  const totalClientes      = empresas.filter(e => e.activo).reduce((a, b) => a + b.clientes, 0)
  const arcaConectadas     = empresas.filter(e => e.arca_conectado && e.activo).length

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Empresas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestioná las empresas de tus clientes desde un solo lugar</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
              <CheckCircle2 size={15} /> Guardado
            </span>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus size={14} /> Nueva empresa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Empresas activas',     value: empresas.filter(e => e.activo).length,  icon: Building2,   color: 'brand'   },
          { label: 'Comprobantes este mes', value: totalFacturasMes,                        icon: FileText,    color: 'violet'  },
          { label: 'Clientes (total)',      value: totalClientes,                           icon: Users,       color: 'emerald' },
          { label: 'Conectadas a ARCA',     value: arcaConectadas,                          icon: Globe,       color: 'amber'   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                <Icon size={16} className={`text-${color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por razón social, CUIT o nombre de fantasía…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Grid de empresas */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <Building2 size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No hay empresas</p>
          <p className="text-sm text-gray-300 mt-1">Agregá tu primera empresa para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(emp => (
            <div
              key={emp.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${emp.activo ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
            >
              {/* Header card */}
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate max-w-[180px]">{emp.razon_social}</p>
                      {emp.nombre_fantasia && (
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{emp.nombre_fantasia}</p>
                      )}
                      <p className="text-xs font-mono text-gray-500 mt-0.5">{emp.cuit}</p>
                    </div>
                  </div>
                  {/* Menú */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMenuId(menuId === emp.id ? null : emp.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuId === emp.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-44 py-1 overflow-hidden">
                        <button
                          onClick={() => openEdit(emp)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Pencil size={13} className="text-gray-400" /> Editar empresa
                        </button>
                        <button
                          onClick={() => toggleActivo(emp.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Receipt size={13} className="text-gray-400" />
                          {emp.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <div className="border-t border-gray-50 my-1" />
                        <button
                          onClick={() => { setDeleteId(emp.id); setMenuId(null) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                    {CONDICION_IVA[emp.condicion_iva]}
                  </span>
                  {emp.arca_conectado ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />ARCA activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">
                      <AlertCircle size={10} /> Sin ARCA
                    </span>
                  )}
                  {!emp.activo && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500">
                      Inactiva
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 border-t border-gray-50">
                {[
                  { label: 'Fact. mes',  value: emp.comprobantes_mes },
                  { label: 'Clientes',   value: emp.clientes         },
                  { label: 'PV default', value: emp.punto_venta_default, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="p-3 text-center border-r border-gray-50 last:border-0">
                    <p className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {emp.ultima_factura
                    ? <>Última factura: <span className="text-gray-600">{new Date(emp.ultima_factura).toLocaleDateString('es-AR')}</span></>
                    : <span className="italic">Sin comprobantes</span>}
                </p>
                <button
                  onClick={() => openEdit(emp)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Configurar <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Crear / Editar ──────────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.editing ? 'Editar empresa' : 'Nueva empresa'}
              </h2>
              <button onClick={() => setModal({ open: false, editing: null })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-100 shrink-0">
              <div className="flex gap-1">
                {([['datos','Datos generales'],['fiscal','Fiscal'],['domicilio','Domicilio']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form body */}
            <div className="overflow-y-auto flex-1 p-6">
              {activeTab === 'datos' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón social *</label>
                    <input value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de fantasía</label>
                    <input value={form.nombre_fantasia} onChange={e => setForm(f => ({ ...f, nombre_fantasia: e.target.value }))} className={inputCls} placeholder="Opcional" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CUIT *</label>
                    <input value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} className={inputCls + ' font-mono'} placeholder="30-XXXXXXXX-X" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="flex items-center gap-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activo ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm text-gray-700">{form.activo ? 'Activa' : 'Inactiva'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'fiscal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condición ante IVA *</label>
                    <select value={form.condicion_iva} onChange={e => setForm(f => ({ ...f, condicion_iva: e.target.value as Empresa['condicion_iva'] }))} className={inputCls}>
                      <option value="RI">Responsable Inscripto</option>
                      <option value="MONO">Monotributista</option>
                      <option value="EX">Exento</option>
                      <option value="CF">Consumidor Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Régimen</label>
                    <select value={form.regimen} onChange={e => setForm(f => ({ ...f, regimen: e.target.value }))} className={inputCls}>
                      <option value="general">Régimen General</option>
                      <option value="simplificado">Monotributo</option>
                      <option value="rg4004">RG 4004 — Exportación de Servicios</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código actividad AFIP</label>
                    <input value={form.actividades} onChange={e => setForm(f => ({ ...f, actividades: e.target.value }))} className={inputCls + ' font-mono'} placeholder="ej: 620100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos Brutos</label>
                    <input value={form.ingresos_brutos} onChange={e => setForm(f => ({ ...f, ingresos_brutos: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Punto de venta default</label>
                    <input value={form.punto_venta_default} onChange={e => setForm(f => ({ ...f, punto_venta_default: e.target.value.padStart(4,'0').slice(-4) }))} className={inputCls + ' font-mono'} maxLength={4} />
                  </div>
                </div>
              )}

              {activeTab === 'domicilio' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calle y número *</label>
                    <input value={form.domicilio} onChange={e => setForm(f => ({ ...f, domicilio: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                    <input value={form.localidad} onChange={e => setForm(f => ({ ...f, localidad: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <select value={form.provincia} onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))} className={inputCls}>
                      {['Buenos Aires','CABA','Córdoba','Santa Fe','Mendoza','Tucumán','Entre Ríos','Salta','Misiones','Chaco','Corrientes','Neuquén','Río Negro','San Juan','Jujuy','Chubut','San Luis','Catamarca','La Rioja','La Pampa','Santa Cruz','Santiago del Estero','Formosa','Tierra del Fuego'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
              <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={saveModal}
                disabled={!form.razon_social.trim() || !form.cuit.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <Save size={14} /> {modal.editing ? 'Guardar cambios' : 'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">¿Eliminar empresa?</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">Se eliminarán todos los datos de la empresa. Esta acción no puede deshacerse.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => deleteEmpresa(deleteId!)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar menú al hacer click afuera */}
      {menuId !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
      )}
    </div>
  )
}
