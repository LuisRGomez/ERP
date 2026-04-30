import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'

type Producto = {
  id: string
  codigo?: string
  descripcion: string
  tipo: 'producto' | 'servicio'
  unidad_medida: string
  precio_venta: number
  precio_compra: number
  alicuota_iva: number
  stock_actual: number
  stock_minimo: number
  activo: boolean
}

const MOCK: Producto[] = [
  { id: '1', codigo: 'ART-001', descripcion: 'Resma A4 75gr', tipo: 'producto', unidad_medida: 'UN', precio_venta: 2500, precio_compra: 1800, alicuota_iva: 21, stock_actual: 45, stock_minimo: 10, activo: true },
  { id: '2', codigo: 'ART-002', descripcion: 'Lapicera Bic x50', tipo: 'producto', unidad_medida: 'CJ', precio_venta: 3200, precio_compra: 2100, alicuota_iva: 21, stock_actual: 3, stock_minimo: 5, activo: true },
  { id: '3', codigo: 'SRV-001', descripcion: 'Consultoría mensual', tipo: 'servicio', unidad_medida: 'MES', precio_venta: 85000, precio_compra: 0, alicuota_iva: 21, stock_actual: 0, stock_minimo: 0, activo: true },
  { id: '4', codigo: 'ART-003', descripcion: 'Tóner HP LaserJet', tipo: 'producto', unidad_medida: 'UN', precio_venta: 18500, precio_compra: 12000, alicuota_iva: 21, stock_actual: 8, stock_minimo: 2, activo: true },
]

const fmtARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function InventarioPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [tab, setTab] = useState<'productos' | 'movimientos'>('productos')

  const productos = MOCK.filter(p =>
    p.activo &&
    (filtroTipo === '' || p.tipo === filtroTipo) &&
    (p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()))
  )

  const stockBajo = MOCK.filter(p => p.tipo === 'producto' && p.stock_actual <= p.stock_minimo)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">{productos.length} ítems · {stockBajo.length} con stock bajo</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      {/* Alertas stock bajo */}
      {stockBajo.length > 0 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Stock bajo en {stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-600 mt-0.5">{stockBajo.map(p => p.descripcion).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-5">
        {(['productos', 'movimientos'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Todos los tipos</option>
              <option value="producto">Productos</option>
              <option value="servicio">Servicios</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Descripción</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">UM</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">P. Compra</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">P. Venta</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">IVA</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Mín.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map(p => {
                  const stockAlerta = p.tipo === 'producto' && p.stock_actual <= p.stock_minimo
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.codigo || '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.descripcion}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.tipo === 'producto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {p.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{p.unidad_medida}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmtARS(p.precio_compra)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{fmtARS(p.precio_venta)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{p.alicuota_iva}%</td>
                      <td className="px-4 py-3 text-right">
                        {p.tipo === 'producto' ? (
                          <span className={`font-semibold ${stockAlerta ? 'text-red-600' : 'text-slate-900'}`}>
                            {stockAlerta && <AlertTriangle size={12} className="inline mr-1" />}
                            {p.stock_actual}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">{p.tipo === 'producto' ? p.stock_minimo : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'movimientos' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <ArrowLeftRight size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Historial de movimientos de stock</p>
          <p className="text-slate-400 text-xs mt-1">Ingresos por compras, egresos por ventas y ajustes manuales</p>
          <button className="mt-4 flex items-center gap-2 mx-auto bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />
            Ajuste de stock
          </button>
        </div>
      )}
    </div>
  )
}
