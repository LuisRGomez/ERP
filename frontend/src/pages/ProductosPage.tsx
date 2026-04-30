import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, X, Package, Wrench, Filter, Tag } from 'lucide-react'

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type TipoProducto = 'producto' | 'servicio'

interface Producto {
  id: number
  codigo: string
  descripcion: string
  tipo: TipoProducto
  unidad: string
  precio: number
  alicuota_iva: number
  activo: boolean
}

const UNIDADES = ['hs', 'un', 'kg', 'lt', 'm', 'm²', 'km', 'mes', 'año', 'servicio', 'kit', 'caja']

const ALICUOTAS = [
  { value: 0,    label: '0% — Exento' },
  { value: 2.5,  label: '2.5%' },
  { value: 5,    label: '5%' },
  { value: 10.5, label: '10.5%' },
  { value: 21,   label: '21%' },
  { value: 27,   label: '27%' },
]

const EMPTY: Omit<Producto, 'id'> = {
  codigo: '', descripcion: '', tipo: 'servicio',
  unidad: 'hs', precio: 0, alicuota_iva: 21, activo: true,
}

const MOCK: Producto[] = [
  { id:1,  codigo:'SRV-001', descripcion:'Consultoría contable mensual',      tipo:'servicio',  unidad:'mes',  precio:180000,  alicuota_iva:21,   activo:true  },
  { id:2,  codigo:'SRV-002', descripcion:'Liquidación de sueldos',            tipo:'servicio',  unidad:'mes',  precio:45000,   alicuota_iva:21,   activo:true  },
  { id:3,  codigo:'SRV-003', descripcion:'Asesoramiento fiscal',              tipo:'servicio',  unidad:'hs',   precio:25000,   alicuota_iva:21,   activo:true  },
  { id:4,  codigo:'SRV-004', descripcion:'Auditoría de estados contables',    tipo:'servicio',  unidad:'hs',   precio:30000,   alicuota_iva:21,   activo:true  },
  { id:5,  codigo:'SRV-005', descripcion:'Declaración jurada DDJJ anual',     tipo:'servicio',  unidad:'un',   precio:95000,   alicuota_iva:21,   activo:true  },
  { id:6,  codigo:'SRV-006', descripcion:'Presentación de IVA mensual',       tipo:'servicio',  unidad:'un',   precio:18000,   alicuota_iva:21,   activo:true  },
  { id:7,  codigo:'SRV-007', descripcion:'Trámite ante ARCA / AFIP',          tipo:'servicio',  unidad:'un',   precio:12000,   alicuota_iva:21,   activo:true  },
  { id:8,  codigo:'SRV-008', descripcion:'Monotributo — alta y recategoriz.', tipo:'servicio',  unidad:'un',   precio:22000,   alicuota_iva:21,   activo:false },
  { id:9,  codigo:'PROD-001',descripcion:'Software de gestión (licencia anual)', tipo:'producto', unidad:'año',  precio:360000, alicuota_iva:21,   activo:true  },
  { id:10, codigo:'PROD-002',descripcion:'Manual contable impreso',           tipo:'producto',  unidad:'un',   precio:8500,    alicuota_iva:10.5, activo:true  },
  { id:11, codigo:'PROD-003',descripcion:'Carpeta de documentos oficial',     tipo:'producto',  unidad:'kit',  precio:3200,    alicuota_iva:10.5, activo:true  },
  { id:12, codigo:'PROD-004',descripcion:'Token de firma digital',            tipo:'producto',  unidad:'un',   precio:15000,   alicuota_iva:21,   activo:false },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const autoCode = (tipo: TipoProducto, total: number) =>
  `${tipo === 'servicio' ? 'SRV' : 'PROD'}-${String(total + 1).padStart(3, '0')}`

// ─── Componente ────────────────────────────────────────────────────────────────
export default function ProductosPage() {
  const [items, setItems]         = useState(MOCK)
  const [search, setSearch]       = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoProducto | ''>('')
  const [filtroIVA, setFiltroIVA] = useState<number | ''>('')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Producto | null>(null)
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [form, setForm]           = useState<Omit<Producto, 'id'>>(EMPTY)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((p) => {
      const matchSearch = !q || p.descripcion.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      const matchTipo   = !filtroTipo || p.tipo === filtroTipo
      const matchIVA    = filtroIVA === '' || p.alicuota_iva === filtroIVA
      const matchActivo = filtroActivo === 'todos' || (filtroActivo === 'activo' ? p.activo : !p.activo)
      return matchSearch && matchTipo && matchIVA && matchActivo
    })
  }, [items, search, filtroTipo, filtroIVA, filtroActivo])

  const openNew  = () => {
    const code = autoCode('servicio', items.length)
    setEditando(null)
    setForm({ ...EMPTY, codigo: code })
    setShowModal(true)
  }
  const openEdit = (p: Producto) => { setEditando(p); setForm({ ...p }); setShowModal(true) }

  const handleSave = () => {
    if (!form.descripcion.trim()) return
    if (editando) {
      setItems((prev) => prev.map((p) => p.id === editando.id ? { ...form, id: editando.id } : p))
    } else {
      setItems((prev) => [{ ...form, id: Date.now() }, ...prev])
    }
    setShowModal(false)
  }

  const handleDelete = () => {
    if (deleteId !== null) setItems((prev) => prev.filter((p) => p.id !== deleteId))
    setDeleteId(null)
  }

  const f = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  // Stats
  const activos   = items.filter((p) => p.activo).length
  const servicios = items.filter((p) => p.tipo === 'servicio').length
  const productos = items.filter((p) => p.tipo === 'producto').length

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none'

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y Servicios</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activos} activos · {servicios} servicios · {productos} productos
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo ítem
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
            <Package size={16} className="text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total ítems</p>
            <p className="text-xl font-bold text-gray-900">{activos}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
            <Wrench size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Servicios</p>
            <p className="text-xl font-bold text-gray-900">{servicios}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Tag size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Productos</p>
            <p className="text-xl font-bold text-gray-900">{productos}</p>
          </div>
        </div>
      </div>

      {/* ── Lista ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o descripción…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-1 text-gray-400"><Filter size={13} /></div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los tipos</option>
            <option value="servicio">Servicios</option>
            <option value="producto">Productos</option>
          </select>
          <select
            value={filtroIVA}
            onChange={(e) => setFiltroIVA(e.target.value === '' ? '' : Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas las alícuotas</option>
            {ALICUOTAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          {(search || filtroTipo || filtroIVA !== '' || filtroActivo !== 'todos') && (
            <button
              onClick={() => { setSearch(''); setFiltroTipo(''); setFiltroIVA(''); setFiltroActivo('todos') }}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={12} /> Limpiar
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron ítems</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-6 py-3">Código</th>
                  <th className="text-left px-6 py-3">Descripción</th>
                  <th className="text-center px-4 py-3">Tipo</th>
                  <th className="text-center px-4 py-3">Unidad</th>
                  <th className="text-right px-6 py-3">Precio</th>
                  <th className="text-center px-4 py-3">IVA</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors group ${!p.activo ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {p.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          p.tipo === 'servicio' ? 'bg-purple-100' : 'bg-emerald-100'
                        }`}>
                          {p.tipo === 'servicio'
                            ? <Wrench size={13} className="text-purple-600" />
                            : <Package size={13} className="text-emerald-600" />}
                        </div>
                        <span className="font-medium text-gray-800">{p.descripcion}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.tipo === 'servicio'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-500 text-xs">{p.unidad}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-800 font-mono">
                      {fmt(p.precio)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                        {p.alicuota_iva}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400 flex justify-between">
            <span>Mostrando {filtered.length} de {items.length} ítems</span>
            <span>
              {items.filter((p) => p.activo).length} activos ·{' '}
              {items.filter((p) => !p.activo).length} inactivos
            </span>
          </div>
        )}
      </div>

      {/* ── Modal crear / editar ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Package size={16} className="text-brand-700" />
                </div>
                <h2 className="font-bold text-gray-900">
                  {editando ? 'Editar ítem' : 'Nuevo producto / servicio'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['servicio', 'producto'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        f('tipo', t)
                        if (!editando) f('codigo', autoCode(t, items.length))
                        f('unidad', t === 'servicio' ? 'hs' : 'un')
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.tipo === t
                          ? t === 'servicio'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t === 'servicio' ? <Wrench size={16} /> : <Package size={16} />}
                      {t === 'servicio' ? 'Servicio' : 'Producto'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Código SKU *</label>
                  <input
                    value={form.codigo}
                    onChange={(e) => f('codigo', e.target.value.toUpperCase())}
                    className={inputCls + ' font-mono uppercase'}
                    placeholder="SRV-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unidad de medida</label>
                  <select value={form.unidad} onChange={(e) => f('unidad', e.target.value)} className={inputCls}>
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción *</label>
                  <input
                    value={form.descripcion}
                    onChange={(e) => f('descripcion', e.target.value)}
                    placeholder="Nombre del producto o servicio"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Precio unitario (sin IVA) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => f('precio', parseFloat(e.target.value) || 0)}
                    className={inputCls + ' text-right font-mono'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alícuota IVA</label>
                  <select
                    value={form.alicuota_iva}
                    onChange={(e) => f('alicuota_iva', parseFloat(e.target.value))}
                    className={inputCls}
                  >
                    {ALICUOTAS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Preview precio con IVA */}
                <div className="col-span-2 bg-gray-50 rounded-lg px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">Precio con IVA ({form.alicuota_iva}%)</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {fmt(form.precio * (1 + form.alicuota_iva / 100))}
                  </span>
                </div>

                {editando && (
                  <div className="col-span-2 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <button
                      type="button"
                      onClick={() => f('activo', !form.activo)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-brand-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-sm text-gray-500">{form.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  {editando ? 'Guardar cambios' : 'Crear ítem'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmación eliminar ────────────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar ítem?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">
              Se eliminará <strong>{items.find((p) => p.id === deleteId)?.descripcion}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
