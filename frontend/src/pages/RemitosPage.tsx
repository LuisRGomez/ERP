import { useState } from 'react'
import { Plus, Truck, Search, Package } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function RemitosPage() {
  const empresaId = useAuthStore(s => s.empresaId)
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    deposito_origen: '',
    domicilio_entrega: '',
    transportista: '',
    observaciones: '',
  })

  const handleSave = async () => {
    if (!empresaId) return
    setSaving(true)
    try {
      await api.post('/presupuestos/remitos/', { ...form, empresa_id: empresaId, items: [] })
      setOpen(false)
      setForm({ deposito_origen: '', domicilio_entrega: '', transportista: '', observaciones: '' })
    } catch {}
    setSaving(false)
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Remitos</h1>
          <p className="page-subtitle">Órdenes de entrega y despacho</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nuevo remito
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar remitos..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Truck size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No hay remitos registrados</p>
          <p className="text-xs text-slate-400 mt-1">Creá el primer remito con el botón de arriba</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-4 flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nuevo remito
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo remito">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Depósito origen</label>
            <input
              value={form.deposito_origen}
              onChange={e => setForm(f => ({ ...f, deposito_origen: e.target.value }))}
              placeholder="Ej: Depósito Central"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Domicilio de entrega</label>
            <input
              value={form.domicilio_entrega}
              onChange={e => setForm(f => ({ ...f, domicilio_entrega: e.target.value }))}
              placeholder="Dirección completa"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Transportista</label>
            <input
              value={form.transportista}
              onChange={e => setForm(f => ({ ...f, transportista: e.target.value }))}
              placeholder="Nombre del transportista"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Crear remito'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
