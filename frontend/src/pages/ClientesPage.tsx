import { useState, useMemo } from 'react'
import {
  Plus, Search, Pencil, Trash2, X, Mail, Phone,
  MapPin, Building2, Filter, Globe, CreditCard,
  Hash, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type CondIVA = 'RI' | 'MONO' | 'EX' | 'CF'
type TipoDoc = 'CUIT' | 'CUIL' | 'DNI'

interface Cliente {
  id: number
  // Identificación
  razon_social: string
  tipo_doc: TipoDoc
  nro_doc: string
  condicion_iva: CondIVA
  // Contacto
  email: string
  email_facturacion: string
  telefono: string
  contacto: string        // persona de contacto
  // Domicilio estructurado
  calle: string
  localidad: string
  provincia: string
  cp: string
  pais: string
  // Comercial
  condicion_pago: string
  pto_venta_default: string
  activo: boolean
}

// ─── Catálogos ─────────────────────────────────────────────────────────────────
const CONDICION_LABELS: Record<CondIVA, { label: string; color: string }> = {
  RI:   { label: 'Resp. Inscripto', color: 'bg-brand-100 text-brand-700'   },
  MONO: { label: 'Monotributista',  color: 'bg-purple-100 text-purple-700' },
  EX:   { label: 'Exento',          color: 'bg-gray-100 text-gray-600'     },
  CF:   { label: 'Cons. Final',     color: 'bg-green-100 text-green-700'   },
}

const PROVINCIAS = [
  'Buenos Aires','CABA','Córdoba','Santa Fe','Mendoza','Tucumán',
  'Entre Ríos','Salta','Misiones','Chaco','Corrientes','Neuquén',
  'Río Negro','San Juan','Jujuy','Chubut','San Luis','Catamarca',
  'La Rioja','La Pampa','Santa Cruz','Santiago del Estero','Formosa',
  'Tierra del Fuego',
]

const CONDPAGO_OPTS = [
  { value: 'contado', label: 'Contado' },
  { value: '15',      label: '15 días'  },
  { value: '30',      label: '30 días'  },
  { value: '60',      label: '60 días'  },
  { value: '90',      label: '90 días'  },
]

// Puntos de venta de la empresa (se cargan desde Configuración en producción)
const POS_EMPRESA = ['0001','0002','0003']

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK: Cliente[] = [
  { id:1, razon_social:'ACME S.A.',           tipo_doc:'CUIT', nro_doc:'30-71234567-2', condicion_iva:'RI',   email:'contacto@acme.com',     email_facturacion:'facturas@acme.com',    telefono:'011-4321-0000', contacto:'Laura Gómez',    calle:'Av. Corrientes 1234', localidad:'Buenos Aires', provincia:'CABA',          cp:'1043', pais:'Argentina', condicion_pago:'30',     pto_venta_default:'0001', activo:true  },
  { id:2, razon_social:'Tech Solutions SRL',  tipo_doc:'CUIT', nro_doc:'30-65432109-8', condicion_iva:'RI',   email:'info@techsolutions.ar', email_facturacion:'',                    telefono:'011-5678-9012', contacto:'Martín Torres',  calle:'Reconquista 456',    localidad:'Buenos Aires', provincia:'CABA',          cp:'1003', pais:'Argentina', condicion_pago:'contado', pto_venta_default:'0001', activo:true  },
  { id:3, razon_social:'Distribuidora Norte', tipo_doc:'CUIT', nro_doc:'30-20987654-3', condicion_iva:'RI',   email:'ventas@distnorte.com',  email_facturacion:'admin@distnorte.com',  telefono:'0341-420-5555', contacto:'Carlos Rúa',     calle:'San Martín 789',     localidad:'Rosario',      provincia:'Santa Fe',      cp:'2000', pais:'Argentina', condicion_pago:'60',     pto_venta_default:'0001', activo:true  },
  { id:4, razon_social:'Inversiones Del Sur', tipo_doc:'CUIT', nro_doc:'30-70543210-9', condicion_iva:'RI',   email:'admin@invsur.com',      email_facturacion:'',                    telefono:'0261-420-3333', contacto:'Ana Pérez',      calle:'España 1500',        localidad:'Mendoza',      provincia:'Mendoza',       cp:'5500', pais:'Argentina', condicion_pago:'30',     pto_venta_default:'0002', activo:true  },
  { id:5, razon_social:'Grupo Fernández',     tipo_doc:'CUIT', nro_doc:'23-19876543-4', condicion_iva:'MONO', email:'info@grupofernandez.ar',email_facturacion:'',                    telefono:'011-6789-0123', contacto:'',               calle:'Rivadavia 2000',     localidad:'Buenos Aires', provincia:'CABA',          cp:'1033', pais:'Argentina', condicion_pago:'contado', pto_venta_default:'0001', activo:true  },
  { id:6, razon_social:'Juan Carlos Pérez',   tipo_doc:'CUIL', nro_doc:'20-28345678-1', condicion_iva:'CF',   email:'jcperez@gmail.com',     email_facturacion:'',                    telefono:'011-9999-1111', contacto:'',               calle:'Tucumán 3000',       localidad:'Buenos Aires', provincia:'CABA',          cp:'1049', pais:'Argentina', condicion_pago:'contado', pto_venta_default:'0001', activo:true  },
  { id:7, razon_social:'Servicios Cloud SA',  tipo_doc:'CUIT', nro_doc:'30-72345678-9', condicion_iva:'RI',   email:'hola@servicioscloud.ar',email_facturacion:'',                    telefono:'011-4444-2222', contacto:'Diego López',    calle:'Florida 500',        localidad:'Buenos Aires', provincia:'CABA',          cp:'1005', pais:'Argentina', condicion_pago:'30',     pto_venta_default:'0001', activo:false },
  { id:8, razon_social:'Consultoría IT SRL',  tipo_doc:'CUIT', nro_doc:'30-54321098-7', condicion_iva:'RI',   email:'contacto@consultit.com',email_facturacion:'',                    telefono:'0351-111-2233', contacto:'Verónica Sosa',  calle:'Bv. San Juan 100',   localidad:'Córdoba',      provincia:'Córdoba',       cp:'5000', pais:'Argentina', condicion_pago:'60',     pto_venta_default:'0001', activo:true  },
]

const EMPTY: Omit<Cliente,'id'> = {
  razon_social:'', tipo_doc:'CUIT', nro_doc:'', condicion_iva:'RI',
  email:'', email_facturacion:'', telefono:'', contacto:'',
  calle:'', localidad:'', provincia:'Buenos Aires', cp:'', pais:'Argentina',
  condicion_pago:'contado', pto_venta_default:'0001',
  activo:true,
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const [clientes, setClientes]   = useState(MOCK)
  const [search, setSearch]       = useState('')
  const [filtroIVA, setFiltroIVA] = useState<CondIVA|''>('')
  const [filtroActivo, setFiltroActivo] = useState<'todos'|'activo'|'inactivo'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Cliente|null>(null)
  const [deleteId, setDeleteId]   = useState<number|null>(null)
  const [form, setForm]           = useState<Omit<Cliente,'id'>>(EMPTY)
  const [tab, setTab]             = useState<'identif'|'contacto'|'domicilio'|'comercial'>('identif')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clientes.filter((c) => {
      const matchSearch = !q || c.razon_social.toLowerCase().includes(q)
        || c.nro_doc.includes(q) || c.email.toLowerCase().includes(q)
      const matchIVA    = !filtroIVA || c.condicion_iva === filtroIVA
      const matchActivo = filtroActivo === 'todos'
        || (filtroActivo === 'activo' ? c.activo : !c.activo)
      return matchSearch && matchIVA && matchActivo
    })
  }, [clientes, search, filtroIVA, filtroActivo])

  const openNew  = () => { setEditando(null); setForm(EMPTY); setTab('identif'); setShowModal(true) }
  const openEdit = (c: Cliente) => { setEditando(c); setForm({...c}); setTab('identif'); setShowModal(true) }

  const handleSave = () => {
    if (!form.razon_social.trim()) return
    if (editando) {
      setClientes((p) => p.map((c) => c.id === editando.id ? { ...form, id: editando.id } : c))
    } else {
      setClientes((p) => [{ ...form, id: Date.now() }, ...p])
    }
    setShowModal(false)
  }

  const handleDelete = () => {
    if (deleteId !== null) setClientes((p) => p.filter((c) => c.id !== deleteId))
    setDeleteId(null)
  }

  const f = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none'
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5'

  const TABS = [
    { key: 'identif',   label: 'Identificación' },
    { key: 'contacto',  label: 'Contacto'        },
    { key: 'domicilio', label: 'Domicilio'        },
    { key: 'comercial', label: 'Comercial'        },
  ] as const

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientes.filter(c=>c.activo).length} activos · {clientes.length} total
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Filtros + tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 flex flex-wrap gap-3 items-center border-b border-gray-50">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, CUIT o email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Filter size={14} className="text-gray-400 shrink-0" />
          <select value={filtroIVA} onChange={(e) => setFiltroIVA(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">Todas las condiciones</option>
            {Object.entries(CONDICION_LABELS).map(([k,v]) =>
              <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          {(search || filtroIVA || filtroActivo !== 'todos') && (
            <button onClick={() => { setSearch(''); setFiltroIVA(''); setFiltroActivo('todos') }}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Limpiar
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No se encontraron clientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-6 py-3">Razón social</th>
                  <th className="text-left px-6 py-3">Documento</th>
                  <th className="text-left px-6 py-3">Condición IVA</th>
                  <th className="text-left px-6 py-3">Contacto / Email</th>
                  <th className="text-left px-6 py-3">Localidad</th>
                  <th className="text-center px-4 py-3">POS</th>
                  <th className="text-center px-4 py-3">Cond. pago</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => {
                  const cond = CONDICION_LABELS[c.condicion_iva]
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-brand-700">{c.razon_social[0]}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{c.razon_social}</p>
                            {c.contacto && <p className="text-xs text-gray-400">{c.contacto}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500">{c.tipo_doc}</p>
                        <p className="font-mono text-sm text-gray-800">{c.nro_doc}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cond.color}`}>
                          {cond.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(c.email_facturacion || c.email) && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Mail size={11} className="text-gray-400" />
                            {c.email_facturacion || c.email}
                            {c.email_facturacion && (
                              <span className="ml-1 text-[9px] bg-brand-100 text-brand-600 px-1.5 rounded font-semibold">FACT</span>
                            )}
                          </p>
                        )}
                        {c.telefono && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-gray-400" />{c.telefono}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.localidad && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400" />
                            {c.localidad}, {c.provincia}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {c.pto_venta_default}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-gray-500">
                        {CONDPAGO_OPTS.find(o => o.value === c.condicion_pago)?.label ?? c.condicion_pago}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(c)} title="Editar"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(c.id)} title="Eliminar"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal crear / editar ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">

            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Building2 size={16} className="text-brand-700" />
                </div>
                <h2 className="font-bold text-gray-900">
                  {editando ? 'Editar cliente' : 'Nuevo cliente'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 shrink-0">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                    tab === key
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">

              {/* ── Identificación ── */}
              {tab === 'identif' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Razón social *</label>
                    <input value={form.razon_social}
                      onChange={(e) => f('razon_social', e.target.value)}
                      className={inputCls} placeholder="Nombre o razón social" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tipo de documento</label>
                      <select value={form.tipo_doc} onChange={(e) => f('tipo_doc', e.target.value as TipoDoc)} className={inputCls}>
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                        <option value="DNI">DNI</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Número</label>
                      <input value={form.nro_doc}
                        onChange={(e) => f('nro_doc', e.target.value)}
                        placeholder="30-12345678-9" className={inputCls + ' font-mono'} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Condición ante IVA</label>
                      <select value={form.condicion_iva}
                        onChange={(e) => f('condicion_iva', e.target.value as CondIVA)} className={inputCls}>
                        {Object.entries(CONDICION_LABELS).map(([k,v]) =>
                          <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {editando && (
                    <div className="flex items-center gap-3 pt-1">
                      <label className="text-sm font-medium text-gray-700">Estado</label>
                      <button type="button" onClick={() => f('activo', !form.activo)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-brand-600' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : ''}`} />
                      </button>
                      <span className="text-sm text-gray-500">{form.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Contacto ── */}
              {tab === 'contacto' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Persona de contacto</label>
                    <input value={form.contacto} onChange={(e) => f('contacto', e.target.value)}
                      placeholder="Nombre y apellido" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email general</label>
                    <input type="email" value={form.email} onChange={(e) => f('email', e.target.value)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Email de facturación
                      <span className="ml-1 font-normal text-gray-400">(si es diferente al general)</span>
                    </label>
                    <input type="email" value={form.email_facturacion}
                      onChange={(e) => f('email_facturacion', e.target.value)}
                      placeholder="facturas@empresa.com" className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1">
                      Las facturas PDF se enviarán a este email. Si está vacío, se usa el email general.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Teléfono</label>
                    <input value={form.telefono} onChange={(e) => f('telefono', e.target.value)}
                      placeholder="011-4xxx-xxxx" className={inputCls} />
                  </div>
                </div>
              )}

              {/* ── Domicilio ── */}
              {tab === 'domicilio' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Calle y número</label>
                    <input value={form.calle} onChange={(e) => f('calle', e.target.value)}
                      placeholder="Av. Corrientes 1234, Piso 3" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Localidad *</label>
                      <input value={form.localidad} onChange={(e) => f('localidad', e.target.value)}
                        placeholder="Buenos Aires" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Código postal</label>
                      <input value={form.cp} onChange={(e) => f('cp', e.target.value)}
                        placeholder="1043" className={inputCls + ' font-mono'} />
                    </div>
                    <div>
                      <label className={labelCls}>Provincia</label>
                      <select value={form.provincia} onChange={(e) => f('provincia', e.target.value)} className={inputCls}>
                        {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>País</label>
                      <input value={form.pais} onChange={(e) => f('pais', e.target.value)}
                        placeholder="Argentina" className={inputCls} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Globe size={11} /> El domicilio completo aparece en las facturas de exportación (Factura E).
                  </p>
                </div>
              )}

              {/* ── Comercial ── */}
              {tab === 'comercial' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Condición de pago predeterminada</label>
                    <select value={form.condicion_pago}
                      onChange={(e) => f('condicion_pago', e.target.value)} className={inputCls}>
                      {CONDPAGO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Se pre-selecciona al crear una nueva factura para este cliente.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Punto de venta predeterminado</label>
                    <select value={form.pto_venta_default}
                      onChange={(e) => f('pto_venta_default', e.target.value)} className={inputCls + ' font-mono'}>
                      {POS_EMPRESA.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Punto de venta que se usa por defecto al facturarle a este cliente.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                {editando ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar cliente?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">
              Se eliminará <strong>{clientes.find(c=>c.id===deleteId)?.razon_social}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
