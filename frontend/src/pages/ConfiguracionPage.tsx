import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Building2, Receipt, Mail, Upload, CheckCircle, AlertTriangle,
  Save, ChevronRight, Wifi, ShieldCheck, Palette, ImagePlus,
  X, FileText, Eye, EyeOff, Store, Plus, Pencil, Trash2,
} from 'lucide-react'

const SECCIONES = [
  { key: 'empresa',    icon: Building2,   label: 'Datos de la empresa'   },
  { key: 'fiscal',     icon: Receipt,     label: 'Configuración fiscal'   },
  { key: 'puntos',     icon: Store,       label: 'Puntos de venta'        },
  { key: 'arca',       icon: Wifi,        label: 'Conexión ARCA'          },
  { key: 'email',      icon: Mail,        label: 'Email y notificaciones' },
  { key: 'factura',    icon: Palette,     label: 'Diseño de factura'      },
  { key: 'seguridad',  icon: ShieldCheck, label: 'Seguridad'              },
]

// ─── Tipos para Puntos de Venta ───────────────────────────────────────────────
interface PuntoVenta {
  id: number
  numero: string   // '0001'–'9999'
  tipo: 'webservices' | 'facturador' | 'exportaciones'
  descripcion: string
  activo: boolean
}

const TIPO_PV_LABEL: Record<PuntoVenta['tipo'], string> = {
  webservices:   'Web Services (ARCA)',
  facturador:    'Facturador Plus',
  exportaciones: 'Exportaciones',
}

const PV_KEY = 'facturasaas_puntos_venta'
const loadPV = (): PuntoVenta[] => {
  try { return JSON.parse(localStorage.getItem(PV_KEY) ?? '[]') } catch { return [] }
}
const savePV = (data: PuntoVenta[]) => localStorage.setItem(PV_KEY, JSON.stringify(data))

const PV_INITIAL: PuntoVenta[] = [
  { id: 1, numero: '0001', tipo: 'webservices',   descripcion: 'Principal — Web Services',   activo: true  },
  { id: 2, numero: '0002', tipo: 'facturador',    descripcion: 'Facturador Plus de escritorio', activo: false },
]

const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-white'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Carga inicial desde localStorage ─────────────────────────────────────────
const LS_KEY = 'facturasaas_config'
const loadConfig = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}

export default function ConfiguracionPage() {
  const [seccion, setSeccion]       = useState('empresa')
  const [saved, setSaved]           = useState(false)
  const [arcaStatus, setArcaStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')

  // ── Puntos de Venta ───────────────────────────────────────────────────────
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>(() => {
    const stored = loadPV()
    return stored.length ? stored : PV_INITIAL
  })
  const [pvModal, setPvModal] = useState<{ open: boolean; editing: PuntoVenta | null }>({ open: false, editing: null })
  const [pvForm, setPvForm]   = useState<Omit<PuntoVenta, 'id'>>({ numero: '', tipo: 'webservices', descripcion: '', activo: true })
  const [pvDeleteId, setPvDeleteId] = useState<number | null>(null)

  // ── Logo ──────────────────────────────────────────────────────────────────
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoName, setLogoName]       = useState('')
  const logoRef = useRef<HTMLInputElement>(null)

  // ── Certs ARCA ────────────────────────────────────────────────────────────
  const [certName, setCertName] = useState('')
  const [keyName,  setKeyName]  = useState('')
  const certRef = useRef<HTMLInputElement>(null)
  const keyRef  = useRef<HTMLInputElement>(null)

  // ── Seguridad: show/hide passwords ───────────────────────────────────────
  const [showPwd, setShowPwd] = useState({ actual: false, nueva: false, confirmar: false })

  // ── Forms ─────────────────────────────────────────────────────────────────
  const cfg = loadConfig()

  const { register: regEmp, handleSubmit: hsEmp } = useForm({
    defaultValues: {
      razon_social:     cfg.razon_social     ?? 'Mi Empresa S.A.',
      nombre_fantasia:  cfg.nombre_fantasia  ?? '',
      cuit:             cfg.cuit             ?? '30-71234567-8',
      telefono:         cfg.telefono         ?? '+54 11 4xxx-xxxx',
      email:            cfg.email            ?? 'admin@miempresa.com',
      web:              cfg.web              ?? '',
      domicilio:        cfg.domicilio        ?? 'Av. Corrientes 1234, Piso 3',
      localidad:        cfg.localidad        ?? 'Buenos Aires',
      provincia:        cfg.provincia        ?? 'Buenos Aires',
      cp:               cfg.cp               ?? '1043',
    },
  })

  const { register: regFis, handleSubmit: hsFis } = useForm({
    defaultValues: {
      condicion_iva:     cfg.condicion_iva     ?? 'RI',
      inicio_actividades:cfg.inicio_actividades ?? '2015-03-01',
      actividad_afip:    cfg.actividad_afip     ?? '620100',
      ingresos_brutos:   cfg.ingresos_brutos    ?? '902-123456-7',
      punto_venta:       cfg.punto_venta        ?? '0001',
      regimen:           cfg.regimen            ?? 'general',
    },
  })

  const { register: regEmail, handleSubmit: hsEmail } = useForm({
    defaultValues: {
      remitente:  cfg.remitente  ?? 'Mi Empresa S.A.',
      email_from: cfg.email_from ?? 'facturas@miempresa.com',
      reply_to:   cfg.reply_to   ?? 'admin@miempresa.com',
      asunto:     cfg.asunto     ?? 'Tu comprobante de {empresa} — {numero}',
      cuerpo:     cfg.cuerpo     ?? 'Hola {cliente},\n\nTe adjuntamos el comprobante {numero} por {total}.\n\nSaludos,\n{empresa}',
    },
  })

  const { register: regDis, handleSubmit: hsDis } = useForm({
    defaultValues: {
      color_principal: cfg.color_principal ?? '#2563eb',
      color_hex:       cfg.color_hex       ?? '#2563eb',
      plantilla:       cfg.plantilla       ?? 'moderna',
      pie_pagina:      cfg.pie_pagina      ?? 'Gracias por confiar en nosotros.',
      banco:           cfg.banco           ?? 'Banco Galicia',
      tipo_cuenta:     cfg.tipo_cuenta     ?? 'cc',
      cbu:             cfg.cbu             ?? '',
      alias:           cfg.alias           ?? '',
    },
  })

  // Cargar logo guardado en localStorage
  useEffect(() => {
    if (cfg.logo_preview) setLogoPreview(cfg.logo_preview)
    if (cfg.logo_name)    setLogoName(cfg.logo_name)
    if (cfg.cert_name)    setCertName(cfg.cert_name)
    if (cfg.key_name)     setKeyName(cfg.key_name)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('El archivo supera los 2 MB'); return }
    setLogoName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setLogoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'crt' | 'key') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (tipo === 'crt') setCertName(file.name)
    else                setKeyName(file.name)
  }

  const persist = (extra: object = {}) => {
    const current = loadConfig()
    const updated = {
      ...current,
      ...extra,
      logo_preview: logoPreview,
      logo_name:    logoName,
      cert_name:    certName,
      key_name:     keyName,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const testArca = () => {
    setArcaStatus('testing')
    setTimeout(() => setArcaStatus('ok'), 2000)
  }

  // ── PV handlers ──────────────────────────────────────────────────────────
  const openPvCreate = () => {
    setPvForm({ numero: '', tipo: 'webservices', descripcion: '', activo: true })
    setPvModal({ open: true, editing: null })
  }
  const openPvEdit = (pv: PuntoVenta) => {
    setPvForm({ numero: pv.numero, tipo: pv.tipo, descripcion: pv.descripcion, activo: pv.activo })
    setPvModal({ open: true, editing: pv })
  }
  const savePvModal = () => {
    if (!pvForm.numero.trim()) return
    let updated: PuntoVenta[]
    if (pvModal.editing) {
      updated = puntosVenta.map(p => p.id === pvModal.editing!.id ? { ...pvModal.editing!, ...pvForm } : p)
    } else {
      const newId = Math.max(0, ...puntosVenta.map(p => p.id)) + 1
      const num = pvForm.numero.padStart(4, '0')
      updated = [...puntosVenta, { id: newId, ...pvForm, numero: num }]
    }
    setPuntosVenta(updated)
    savePV(updated)
    setPvModal({ open: false, editing: null })
  }
  const togglePvActivo = (id: number) => {
    const updated = puntosVenta.map(p => p.id === id ? { ...p, activo: !p.activo } : p)
    setPuntosVenta(updated)
    savePV(updated)
  }
  const deletePv = (id: number) => {
    const updated = puntosVenta.filter(p => p.id !== id)
    setPuntosVenta(updated)
    savePV(updated)
    setPvDeleteId(null)
  }

  return (
    <div className="flex gap-6 max-w-6xl">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Configuración</p>
          </div>
          <nav className="py-2">
            {SECCIONES.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setSeccion(key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left ${
                  seccion === key
                    ? 'bg-brand-50 text-brand-700 font-semibold border-r-2 border-brand-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={15} className={seccion === key ? 'text-brand-600' : 'text-gray-400'} />
                <span className="flex-1">{label}</span>
                {seccion === key && <ChevronRight size={12} className="text-brand-400" />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 space-y-5">

        {/* ── EMPRESA ─────────────────────────────────────────────────── */}
        {seccion === 'empresa' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Datos de la empresa</h1>
              <p className="text-sm text-gray-400 mt-0.5">Esta información aparece en tus comprobantes electrónicos</p>
            </div>

            <Card title="Logo de la empresa">
              <div className="flex items-start gap-5">
                {/* Preview / placeholder */}
                <div
                  onClick={() => logoRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-100 transition-colors overflow-hidden shrink-0 relative group"
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                        <ImagePlus size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={22} className="text-brand-400" />
                      <span className="text-[10px] mt-1 font-medium text-brand-500">Subir logo</span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    <Upload size={14} /> Cargar imagen
                  </button>
                  {logoName && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText size={12} className="text-brand-500" />
                      <span className="truncate max-w-[180px]">{logoName}</span>
                      <button onClick={() => { setLogoPreview(null); setLogoName('') }}>
                        <X size={12} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">PNG o JPG · máx. 2 MB<br />Recomendado: 200×200 px, fondo transparente</p>
                </div>

                {/* Input oculto */}
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </Card>

            <Card title="Datos generales">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Razón social *"><input {...regEmp('razon_social')} className={inputCls} /></Field>
                <Field label="Nombre de fantasía"><input {...regEmp('nombre_fantasia')} placeholder="Opcional" className={inputCls} /></Field>
                <Field label="CUIT *" hint="Formato: 30-XXXXXXXX-X">
                  <input {...regEmp('cuit')} className={inputCls + ' font-mono'} />
                </Field>
                <Field label="Teléfono"><input {...regEmp('telefono')} className={inputCls} /></Field>
                <Field label="Email *"><input {...regEmp('email')} type="email" className={inputCls} /></Field>
                <Field label="Sitio web"><input {...regEmp('web')} placeholder="https://" className={inputCls} /></Field>
              </div>
            </Card>

            <Card title="Domicilio fiscal">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Calle y número *"><input {...regEmp('domicilio')} className={inputCls} /></Field>
                </div>
                <Field label="Localidad *"><input {...regEmp('localidad')} className={inputCls} /></Field>
                <Field label="Provincia *">
                  <select {...regEmp('provincia')} className={inputCls}>
                    {['Buenos Aires','CABA','Córdoba','Santa Fe','Mendoza','Tucumán','Entre Ríos','Salta','Misiones','Chaco','Corrientes','Neuquén','Río Negro','San Juan','Jujuy','Chubut','San Luis','Catamarca','La Rioja','La Pampa','Santa Cruz','Santiago del Estero','Formosa','Tierra del Fuego'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Código postal"><input {...regEmp('cp')} className={inputCls} /></Field>
              </div>
            </Card>

            <SaveBar saved={saved} onSave={hsEmp((data) => persist(data))} />
          </>
        )}

        {/* ── FISCAL ──────────────────────────────────────────────────── */}
        {seccion === 'fiscal' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Configuración fiscal</h1>
              <p className="text-sm text-gray-400 mt-0.5">Datos impositivos requeridos para la emisión de comprobantes</p>
            </div>

            <Card title="IVA e ingresos brutos">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Condición ante IVA *">
                  <select {...regFis('condicion_iva')} className={inputCls}>
                    <option value="RI">Responsable Inscripto</option>
                    <option value="MONO">Monotributista</option>
                    <option value="EX">Exento</option>
                    <option value="CF">Consumidor Final</option>
                  </select>
                </Field>
                <Field label="Inicio de actividades">
                  <input {...regFis('inicio_actividades')} type="date" className={inputCls} />
                </Field>
                <Field label="Código actividad AFIP" hint="Ej: 620100 — Servicios de informática">
                  <input {...regFis('actividad_afip')} className={inputCls + ' font-mono'} />
                </Field>
                <Field label="N° Ingresos Brutos">
                  <input {...regFis('ingresos_brutos')} className={inputCls} />
                </Field>
              </div>
            </Card>

            <Card title="Punto de venta y régimen">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Número de punto de venta *" hint="Dado de alta en ARCA como Web Service">
                  <input {...regFis('punto_venta')} className={inputCls + ' font-mono'} />
                </Field>
                <Field label="Régimen de facturación">
                  <select {...regFis('regimen')} className={inputCls}>
                    <option value="general">Régimen General</option>
                    <option value="simplificado">Monotributo</option>
                    <option value="rg4004">RG 4004 — Exportación de Servicios</option>
                  </select>
                </Field>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mt-2">
                <strong>¿Cómo crear el punto de venta?</strong>
                <ol className="mt-2 space-y-1 text-xs text-blue-700 list-decimal list-inside">
                  <li>Ingresá a <strong>arca.gob.ar</strong> con tu Clave Fiscal</li>
                  <li>Administrador de Relaciones → Adherir Servicio → Facturación Electrónica</li>
                  <li>Crear un Punto de Venta tipo <strong>ONLINE (Web Services)</strong></li>
                </ol>
              </div>
            </Card>

            <SaveBar saved={saved} onSave={hsFis((data) => persist(data))} />
          </>
        )}

        {/* ── PUNTOS DE VENTA ─────────────────────────────────────────── */}
        {seccion === 'puntos' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Puntos de venta</h1>
                <p className="text-sm text-gray-400 mt-0.5">Puntos de venta dados de alta en ARCA asociados a esta empresa</p>
              </div>
              <button
                onClick={openPvCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
              >
                <Plus size={14} /> Nuevo punto de venta
              </button>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">¿Para qué sirve?</p>
              <p className="text-xs text-blue-700">Cada comprobante que emitís lleva un número de punto de venta. Los de tipo <strong>Web Services</strong> se usan con FacturaSaaS. Podés tener varios activos para distintos tipos de comprobante.</p>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">N°</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tipo</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Descripción</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {puntosVenta.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                        No hay puntos de venta configurados
                      </td>
                    </tr>
                  )}
                  {puntosVenta.map(pv => (
                    <tr key={pv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-bold text-gray-900">{pv.numero}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          pv.tipo === 'webservices' ? 'bg-brand-50 text-brand-700' :
                          pv.tipo === 'facturador'  ? 'bg-violet-50 text-violet-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {TIPO_PV_LABEL[pv.tipo]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{pv.descripcion || <span className="text-gray-300 italic">Sin descripción</span>}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => togglePvActivo(pv.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${pv.activo ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${pv.activo ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className={`ml-2 text-xs font-medium ${pv.activo ? 'text-emerald-700' : 'text-gray-400'}`}>
                          {pv.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPvEdit(pv)}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setPvDeleteId(pv.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Crear / Editar */}
            {pvModal.open && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">
                    {pvModal.editing ? 'Editar punto de venta' : 'Nuevo punto de venta'}
                  </h3>
                  <div className="space-y-4">
                    <Field label="Número *" hint="4 dígitos (ej: 0001)">
                      <input
                        type="text"
                        maxLength={4}
                        value={pvForm.numero}
                        onChange={e => setPvForm(f => ({ ...f, numero: e.target.value.replace(/\D/g,'') }))}
                        className={inputCls + ' font-mono tracking-widest text-center text-lg font-bold'}
                        placeholder="0001"
                      />
                    </Field>
                    <Field label="Tipo *">
                      <select
                        value={pvForm.tipo}
                        onChange={e => setPvForm(f => ({ ...f, tipo: e.target.value as PuntoVenta['tipo'] }))}
                        className={inputCls}
                      >
                        <option value="webservices">Web Services (ARCA) — para FacturaSaaS</option>
                        <option value="facturador">Facturador Plus</option>
                        <option value="exportaciones">Exportaciones</option>
                      </select>
                    </Field>
                    <Field label="Descripción" hint="Opcional — ej: Oficina central, Online, Exportaciones">
                      <input
                        value={pvForm.descripcion}
                        onChange={e => setPvForm(f => ({ ...f, descripcion: e.target.value }))}
                        className={inputCls}
                        placeholder="ej: Principal - Web Services"
                      />
                    </Field>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPvForm(f => ({ ...f, activo: !f.activo }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pvForm.activo ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${pvForm.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm text-gray-700">Activo</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setPvModal({ open: false, editing: null })}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={savePvModal}
                      disabled={!pvForm.numero.trim()}
                      className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      <Save size={14} /> {pvModal.editing ? 'Guardar cambios' : 'Crear punto de venta'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm delete */}
            {pvDeleteId !== null && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={22} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">¿Eliminar punto de venta?</h3>
                  <p className="text-sm text-gray-500 mt-2 mb-6">Esta acción no puede deshacerse.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setPvDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={() => deletePv(pvDeleteId!)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium">Eliminar</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ARCA ────────────────────────────────────────────────────── */}
        {seccion === 'arca' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Conexión ARCA</h1>
              <p className="text-sm text-gray-400 mt-0.5">Autorizá a FacturaSaaS para emitir comprobantes en tu nombre</p>
            </div>

            {/* Status */}
            <div className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${
              arcaStatus === 'ok'      ? 'bg-emerald-50 border-emerald-200'
              : arcaStatus === 'error' ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
            }`}>
              {arcaStatus === 'ok'
                ? <CheckCircle size={22} className="text-emerald-600 shrink-0" />
                : arcaStatus === 'error'
                  ? <AlertTriangle size={22} className="text-red-600 shrink-0" />
                  : <Wifi size={22} className="text-gray-400 shrink-0" />}
              <div>
                <p className={`font-semibold text-sm ${arcaStatus === 'ok' ? 'text-emerald-800' : arcaStatus === 'error' ? 'text-red-800' : 'text-gray-700'}`}>
                  {arcaStatus === 'ok'      ? 'Conexión activa — ARCA responde correctamente'
                    : arcaStatus === 'error' ? 'Error de conexión — verificá el CUIT y el certificado'
                    : arcaStatus === 'testing' ? 'Verificando conexión…'
                    : 'Sin verificar — completá los datos y probá la conexión'}
                </p>
                {arcaStatus === 'ok' && (
                  <p className="text-xs text-emerald-600 mt-0.5">Ambiente: Testing · Último token: hace 2 horas</p>
                )}
              </div>
            </div>

            <Card title="Credenciales y ambiente">
              <Field label="Ambiente ARCA">
                <select className={inputCls}>
                  <option value="testing">Testing (homologación)</option>
                  <option value="production">Producción</option>
                </select>
              </Field>

              {/* Certificado .crt */}
              <Field label="Certificado digital (.crt)" hint="Generalo desde ARCA → Administración de Certificados">
                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm ${certName ? 'text-gray-800' : 'text-gray-400'}`}>
                    {certName ? <FileText size={14} className="text-brand-500 shrink-0" /> : null}
                    <span className="truncate">{certName || 'Sin certificado cargado'}</span>
                    {certName && (
                      <button onClick={() => setCertName('')} className="ml-auto shrink-0">
                        <X size={13} className="text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap transition-colors">
                    <Upload size={14} /> Subir .crt
                    <input
                      ref={certRef}
                      type="file"
                      accept=".crt,.pem"
                      className="hidden"
                      onChange={(e) => handleCertChange(e, 'crt')}
                    />
                  </label>
                </div>
              </Field>

              {/* Clave .key */}
              <Field label="Clave privada (.key)" hint="La clave privada generada junto al certificado">
                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm ${keyName ? 'text-gray-800' : 'text-gray-400'}`}>
                    {keyName ? <FileText size={14} className="text-brand-500 shrink-0" /> : null}
                    <span className="truncate">{keyName || 'Sin clave cargada'}</span>
                    {keyName && (
                      <button onClick={() => setKeyName('')} className="ml-auto shrink-0">
                        <X size={13} className="text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap transition-colors">
                    <Upload size={14} /> Subir .key
                    <input
                      ref={keyRef}
                      type="file"
                      accept=".key,.pem"
                      className="hidden"
                      onChange={(e) => handleCertChange(e, 'key')}
                    />
                  </label>
                </div>
              </Field>
            </Card>

            <div className="flex justify-end">
              <button
                onClick={testArca}
                disabled={arcaStatus === 'testing'}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                <Wifi size={14} /> {arcaStatus === 'testing' ? 'Verificando…' : 'Verificar conexión con ARCA'}
              </button>
            </div>
          </>
        )}

        {/* ── EMAIL ───────────────────────────────────────────────────── */}
        {seccion === 'email' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email y notificaciones</h1>
              <p className="text-sm text-gray-400 mt-0.5">Cómo y cuándo se envían los comprobantes a tus clientes</p>
            </div>

            <Card title="Remitente">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre del remitente">
                  <input {...regEmail('remitente')} className={inputCls} />
                </Field>
                <Field label="Email de envío" hint="Debe estar verificado">
                  <input {...regEmail('email_from')} type="email" className={inputCls} />
                </Field>
                <Field label="Reply-to">
                  <input {...regEmail('reply_to')} type="email" className={inputCls} />
                </Field>
                <Field label="Asunto">
                  <input {...regEmail('asunto')} className={inputCls} />
                </Field>
              </div>
            </Card>

            <Card title="Cuerpo del email">
              <Field label="Mensaje" hint="Variables: {cliente}, {numero}, {total}, {empresa}">
                <textarea
                  {...regEmail('cuerpo')}
                  rows={4}
                  className={inputCls + ' resize-none font-mono text-xs'}
                />
              </Field>
            </Card>

            <Card title="Notificaciones automáticas">
              {[
                { key: 'auto_enviar',     label: 'Enviar factura automáticamente al emitirla', on: true },
                { key: 'notif_cae',       label: 'Notificar al cliente cuando el CAE esté disponible', on: true },
                { key: 'copia_yo',        label: 'Copia a mí de cada factura emitida', on: false },
                { key: 'alerta_vto',      label: 'Alertas de vencimiento de comprobantes', on: true },
                { key: 'recordatorio',    label: 'Recordatorio semanal de facturas pendientes de cobro', on: false },
              ].map(({ key, label, on }) => (
                <label key={key} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <input type="checkbox" defaultChecked={on} className="w-4 h-4 accent-brand-600" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </Card>

            <SaveBar saved={saved} onSave={hsEmail((data) => persist(data))} />
          </>
        )}

        {/* ── DISEÑO ──────────────────────────────────────────────────── */}
        {seccion === 'factura' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Diseño de factura</h1>
              <p className="text-sm text-gray-400 mt-0.5">Personalizá el PDF que reciben tus clientes</p>
            </div>

            <Card title="Colores y plantilla">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Color principal">
                  <div className="flex items-center gap-3">
                    <input
                      {...regDis('color_principal')}
                      type="color"
                      className="w-11 h-11 rounded-lg border border-gray-200 cursor-pointer p-1 shrink-0"
                    />
                    <input {...regDis('color_hex')} className={inputCls + ' font-mono'} placeholder="#2563eb" />
                  </div>
                </Field>
                <Field label="Plantilla">
                  <select {...regDis('plantilla')} className={inputCls}>
                    <option value="moderna">Moderna (default)</option>
                    <option value="clasica">Clásica</option>
                    <option value="minimalista">Minimalista</option>
                  </select>
                </Field>
              </div>
            </Card>

            <Card title="Pie de página y datos bancarios">
              <Field label="Texto del pie" hint="Aparece al pie de todos tus comprobantes PDF">
                <textarea {...regDis('pie_pagina')} rows={2} className={inputCls + ' resize-none'} />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer mt-1 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700">Mostrar datos bancarios para transferencia</span>
              </label>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Field label="Banco"><input {...regDis('banco')} className={inputCls} /></Field>
                <Field label="Tipo de cuenta">
                  <select {...regDis('tipo_cuenta')} className={inputCls}>
                    <option value="cc">Cuenta corriente en $</option>
                    <option value="ca">Caja de ahorros en $</option>
                    <option value="ca_usd">Caja de ahorros en USD</option>
                  </select>
                </Field>
                <Field label="CBU">
                  <input {...regDis('cbu')} placeholder="0000000000000000000000" className={inputCls + ' font-mono'} />
                </Field>
                <Field label="Alias">
                  <input {...regDis('alias')} placeholder="MI.EMPRESA.ALIAS" className={inputCls + ' font-mono'} />
                </Field>
              </div>
            </Card>

            <SaveBar saved={saved} onSave={hsDis((data) => persist(data))} />
          </>
        )}

        {/* ── SEGURIDAD ───────────────────────────────────────────────── */}
        {seccion === 'seguridad' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Seguridad</h1>
              <p className="text-sm text-gray-400 mt-0.5">Acceso y autenticación de tu cuenta</p>
            </div>

            <Card title="Cambiar contraseña">
              <div className="space-y-4 max-w-sm">
                {(['actual', 'nueva', 'confirmar'] as const).map((field) => (
                  <Field
                    key={field}
                    label={field === 'actual' ? 'Contraseña actual' : field === 'nueva' ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}
                  >
                    <div className="relative">
                      <input
                        type={showPwd[field] ? 'text' : 'password'}
                        className={inputCls + ' pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPwd[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                ))}
                <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                  <ShieldCheck size={14} /> Actualizar contraseña
                </button>
              </div>
            </Card>

            <Card title="Sesiones activas">
              {[
                { dispositivo: 'Chrome · Windows 11', lugar: 'Buenos Aires, AR', hace: 'Ahora',        actual: true  },
                { dispositivo: 'Safari · iPhone 15',  lugar: 'Buenos Aires, AR', hace: 'Hace 2 horas', actual: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.actual ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.dispositivo}</p>
                      <p className="text-xs text-gray-400">{s.lugar} · {s.hace}</p>
                    </div>
                  </div>
                  {s.actual
                    ? <span className="text-xs text-emerald-600 font-medium">Sesión actual</span>
                    : <button className="text-xs text-red-500 hover:underline font-medium">Cerrar</button>}
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Barra de guardado reutilizable ───────────────────────────────────────────
function SaveBar({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pb-4">
      {saved && (
        <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
          <CheckCircle size={15} /> Guardado correctamente
        </span>
      )}
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
      >
        <Save size={14} /> Guardar cambios
      </button>
    </div>
  )
}
