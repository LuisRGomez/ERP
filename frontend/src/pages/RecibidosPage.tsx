import { useState } from 'react'
import { Upload, Plus, X, FileText, CheckCircle, Clock } from 'lucide-react'

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

interface FacturaRecibida {
  id: number
  fecha: string
  proveedor: string
  cuit: string
  numero: string
  neto: number
  iva: number
  total: number
  estado: 'REGISTRADA' | 'PENDIENTE_PAGO' | 'PAGADA'
}

const MOCK: FacturaRecibida[] = [
  { id:1, fecha:'25/04/2026', proveedor:'Tech Parts SRL',       cuit:'30-71234567-2', numero:'B-0002-00000456', neto:78512,  iva:16487, total:95000,  estado:'PENDIENTE_PAGO' },
  { id:2, fecha:'20/04/2026', proveedor:'Suministros SRL',      cuit:'20-28345678-1', numero:'B-0001-00000312', neto:34710,  iva:7289,  total:42000,  estado:'PAGADA' },
  { id:3, fecha:'18/04/2026', proveedor:'Logística Express SA', cuit:'30-65432109-8', numero:'A-0001-00001234', neto:62810,  iva:13190, total:76000,  estado:'PAGADA' },
  { id:4, fecha:'15/04/2026', proveedor:'Servicios Cloud SA',   cuit:'30-70987654-3', numero:'A-0002-00000089', neto:41322,  iva:8678,  total:50000,  estado:'REGISTRADA' },
  { id:5, fecha:'10/04/2026', proveedor:'Materiales del Norte', cuit:'23-19876543-4', numero:'C-0001-00000567', neto:28926,  iva:6074,  total:35000,  estado:'PAGADA' },
  { id:6, fecha:'08/04/2026', proveedor:'Consultoría IT SRL',   cuit:'30-72345678-9', numero:'B-0001-00000789', neto:99174,  iva:20826, total:120000, estado:'PAGADA' },
  { id:7, fecha:'05/04/2026', proveedor:'Telefonía Corp',       cuit:'30-54321098-7', numero:'A-0003-00012345', neto:18182,  iva:3818,  total:22000,  estado:'PAGADA' },
  { id:8, fecha:'02/04/2026', proveedor:'Alquiler Oficina SA',  cuit:'20-30123456-5', numero:'B-0001-00000234', neto:70248,  iva:14752, total:85000,  estado:'PENDIENTE_PAGO' },
]

const estadoCfg: Record<string, { label: string; classes: string; icon: any }> = {
  REGISTRADA:    { label: 'Registrada',    classes: 'bg-gray-100 text-gray-600',    icon: FileText    },
  PENDIENTE_PAGO:{ label: 'Pendiente pago',classes: 'bg-yellow-100 text-yellow-700', icon: Clock       },
  PAGADA:        { label: 'Pagada',        classes: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
}

const ALICUOTAS = [{ v:'21', l:'21%' }, { v:'10.5', l:'10.5%' }, { v:'27', l:'27%' }, { v:'0', l:'Exento' }]

export default function RecibidosPage() {
  const [facturas, setFacturas] = useState(MOCK)
  const [showModal, setShowModal] = useState(false)
  const [tabModal, setTabModal] = useState<'ocr' | 'manual'>('manual')
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [form, setForm] = useState({ proveedor:'', cuit:'', numero:'', fecha:'', neto:'', alicuota:'21' })

  const totalNeto = facturas.reduce((s, f) => s + f.neto, 0)
  const totalIva  = facturas.reduce((s, f) => s + f.iva, 0)
  const totalMonto = facturas.reduce((s, f) => s + f.total, 0)

  const handleOcrDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOcrProcessing(true)
    setTimeout(() => {
      setOcrProcessing(false)
      setForm({
        proveedor: 'Proveedor Detectado SA',
        cuit: '30-71234567-8',
        numero: 'A-0001-00001567',
        fecha: new Date().toISOString().split('T')[0],
        neto: '82645',
        alicuota: '21',
      })
      setTabModal('manual')
    }, 2500)
  }

  const handleGuardar = () => {
    const neto  = parseFloat(form.neto) || 0
    const iva   = neto * (parseFloat(form.alicuota) / 100)
    const total = neto + iva
    const nueva: FacturaRecibida = {
      id: Date.now(),
      fecha: form.fecha || new Date().toLocaleDateString('es-AR'),
      proveedor: form.proveedor,
      cuit: form.cuit,
      numero: form.numero,
      neto, iva, total,
      estado: 'REGISTRADA',
    }
    setFacturas((prev) => [nueva, ...prev])
    setShowModal(false)
    setForm({ proveedor:'', cuit:'', numero:'', fecha:'', neto:'', alicuota:'21' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes Recibidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Facturas de proveedores — IVA Crédito Fiscal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Cargar factura
        </button>
      </div>

      {/* Resumen IVA */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total neto compras</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalNeto)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">IVA Crédito Fiscal</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(totalIva)}</p>
          <p className="text-xs text-gray-400 mt-1">Podés descontarlo del IVA débito</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total con IVA</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalMonto)}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3">Fecha</th>
                <th className="text-left px-6 py-3">Proveedor</th>
                <th className="text-left px-6 py-3">CUIT</th>
                <th className="text-left px-6 py-3">N° Factura</th>
                <th className="text-right px-6 py-3">Neto</th>
                <th className="text-right px-6 py-3">IVA</th>
                <th className="text-right px-6 py-3">Total</th>
                <th className="text-center px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {facturas.map((f) => {
                const cfg = estadoCfg[f.estado]
                return (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-600">{f.fecha}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{f.proveedor}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{f.cuit}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{f.numero}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{fmt(f.neto)}</td>
                    <td className="px-6 py-3 text-right text-emerald-600 font-medium">{fmt(f.iva)}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{fmt(f.total)}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr className="font-bold text-gray-900">
                <td colSpan={4} className="px-6 py-3 text-sm">TOTALES</td>
                <td className="px-6 py-3 text-right">{fmt(totalNeto)}</td>
                <td className="px-6 py-3 text-right text-emerald-700">{fmt(totalIva)}</td>
                <td className="px-6 py-3 text-right">{fmt(totalMonto)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Cargar factura recibida</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Tabs modal */}
            <div className="flex border-b border-gray-100">
              {(['ocr', 'manual'] as const).map((t) => (
                <button key={t} onClick={() => setTabModal(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tabModal === t ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'ocr' ? '📎 Subir PDF / imagen' : '✏️ Carga manual'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tabModal === 'ocr' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleOcrDrop}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-brand-400 transition-colors cursor-pointer"
                  onClick={() => { setOcrProcessing(true); setTimeout(() => { setOcrProcessing(false); setTabModal('manual'); setForm({ proveedor:'Proveedor OCR SA', cuit:'30-71234567-8', numero:'A-0001-00001567', fecha:'2026-04-28', neto:'82645', alicuota:'21' }) }, 2500) }}
                >
                  {ocrProcessing ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-medium text-brand-700">Procesando con OCR...</p>
                      <p className="text-xs text-gray-400">Extrayendo datos de la factura</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload size={36} className="mx-auto text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">Arrastrá o hacé click para subir</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG — hasta 10MB</p>
                      <p className="text-xs text-brand-600 font-medium">PyMuPDF + Tesseract OCR</p>
                    </div>
                  )}
                </div>
              )}

              {tabModal === 'manual' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor</label>
                      <input value={form.proveedor} onChange={(e) => setForm({...form, proveedor:e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CUIT</label>
                      <input value={form.cuit} onChange={(e) => setForm({...form, cuit:e.target.value})}
                        placeholder="20-12345678-9"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">N° Comprobante</label>
                      <input value={form.numero} onChange={(e) => setForm({...form, numero:e.target.value})}
                        placeholder="A-0001-00001234"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                      <input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha:e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Monto neto</label>
                      <input type="number" value={form.neto} onChange={(e) => setForm({...form, neto:e.target.value})}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Alícuota IVA</label>
                      <select value={form.alicuota} onChange={(e) => setForm({...form, alicuota:e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        {ALICUOTAS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.neto && (
                    <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Neto</span><span>{fmt(parseFloat(form.neto)||0)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>IVA {form.alicuota}%</span>
                        <span>{fmt((parseFloat(form.neto)||0) * (parseFloat(form.alicuota)/100))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                        <span>Total</span>
                        <span>{fmt((parseFloat(form.neto)||0) * (1 + parseFloat(form.alicuota)/100))}</span>
                      </div>
                    </div>
                  )}
                  <button onClick={handleGuardar}
                    className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-700 transition-colors">
                    Guardar comprobante
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
