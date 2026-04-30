import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { inventarioApi } from '@/services/erp'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/ui/Modal'
import api from '@/services/api'

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const EMPTY = {
  codigo: '', descripcion: '', tipo: 'producto', unidad_medida: 'UN',
  precio_venta: '', precio_compra: '', alicuota_iva: '21',
  stock_actual: '0', stock_minimo: '0',
}

export default function InventarioPage() {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [tab, setTab] = useState<'productos' | 'movimientos'>('productos')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery((eid) => inventarioApi.listarProductos(eid))

  const productos = (data ?? []).filter((p: any) =>
    p.activo &&
    (filtroTipo === '' || p.tipo === filtroTipo) &&
    (p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase()))
  )
  const stockBajo = (data ?? []).filter((p: any) => p.tipo === 'producto' && p.stock_actual <= p.stock_minimo && p.activo)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.descripcion.trim()) { setFormError('La descripción es obligatoria'); return }
    setSaving(true); setFormError(null)
    try {
      await api.post('/inventario/productos/', {
        ...form,
        empresa_id: empresaId,
        precio_venta: parseFloat(form.precio_venta) || 0,
        precio_compra: parseFloat(form.precio_compra) || 0,
        alicuota_iva: parseFloat(form.alicuota_iva) || 21,
        stock_actual: parseFloat(form.stock_actual) || 0,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
        activo: true,
      })
      setOpen(false); setForm(EMPTY); refetch()
    } catch (e: any) {
      setFormError(e?.response?.data?.detail ?? 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{loading ? '…' : `${productos.length} ítems · ${stockBajo.length} con stock bajo`}</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {stockBajo.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={17} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Stock bajo en {stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-600 mt-0.5">{stockBajo.map((p: any) => p.descripcion).join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['productos', 'movimientos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todos los tipos</option>
              <option value="producto">Productos</option>
              <option value="servicio">Servicios</option>
            </select>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Cargando productos…</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Código</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">UM</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">P. Compra</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">P. Venta</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">IVA</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productos.map((p: any) => {
                    const alerta = p.tipo === 'producto' && p.stock_actual <= p.stock_minimo
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{p.codigo || '—'}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{p.descripcion}</td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${p.tipo === 'producto' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60' : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60'}`}>
                            {p.tipo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">{p.unidad_medida}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500">{fmtARS(p.precio_compra)}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-slate-900">{fmtARS(p.precio_venta)}</td>
                        <td className="px-5 py-3.5 text-right text-slate-400">{p.alicuota_iva}%</td>
                        <td className="px-5 py-3.5 text-right">
                          {p.tipo === 'producto' ? (
                            <span className={`font-semibold ${alerta ? 'text-red-600' : 'text-slate-900'}`}>
                              {alerta && <AlertTriangle size={11} className="inline mr-1" />}{p.stock_actual}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {productos.length === 0 && !loading && (
                    <tr><td colSpan={8} className="px-5 py-14 text-center">
                      <Package size={28} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">No hay productos registrados</p>
                      <button onClick={() => setOpen(true)} className="mt-3 text-xs text-brand-600 hover:underline font-medium">+ Agregar producto</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'movimientos' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
          <Package size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">Historial de movimientos</p>
          <p className="text-xs text-slate-400 mt-1">Ingresos, egresos y ajustes de stock</p>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo producto">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
              <input value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="ART-001"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
            <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidad medida</label>
              <input value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">IVA %</label>
              <select value={form.alicuota_iva} onChange={e => set('alicuota_iva', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="0">0%</option>
                <option value="10.5">10.5%</option>
                <option value="21">21%</option>
                <option value="27">27%</option>
              </select>
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio compra</label>
              <input value={form.precio_compra} onChange={e => set('precio_compra', e.target.value)} type="number" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio venta</label>
              <input value={form.precio_venta} onChange={e => set('precio_venta', e.target.value)} type="number" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          {form.tipo === 'producto' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock inicial</label>
                <input value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)} type="number" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock mínimo</label>
                <input value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} type="number" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          )}
          {formError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{formError}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
