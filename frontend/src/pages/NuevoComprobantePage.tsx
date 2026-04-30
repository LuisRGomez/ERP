import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  Plus, Trash2, ArrowLeft, Save, Send, FileDown, Upload,
  AlertTriangle, Calendar, Link2, Info, CheckCircle2,
} from 'lucide-react'
import { descargarPDF, pdfToBlob, type PdfData } from '@/utils/generarPDF'

// ─── Mock data ─────────────────────────────────────────────────────────────────
const EMPRESA_MOCK = {
  razon_social: 'Mi Empresa S.A.',
  cuit: '30-71234567-8',
  domicilio: 'Av. Corrientes 1234, CABA',
  cond_iva: 'RI',
  inicio_actividades: '2015-03-01',
  iibb: '901-123456-0',
}

const CLIENTES_MOCK = [
  { id: '1', razon_social: 'ACME S.A.',           cuit: '30-71234567-8', cond_iva: 'RI',   domicilio: 'Maipú 456, CABA' },
  { id: '2', razon_social: 'Tech Solutions SRL',  cuit: '30-65432100-1', cond_iva: 'RI',   domicilio: 'Reconquista 789, CABA' },
  { id: '3', razon_social: 'Distribuidora Norte', cuit: '30-60998877-5', cond_iva: 'RI',   domicilio: 'Belgrano 321, Rosario' },
  { id: '4', razon_social: 'Inversiones Del Sur', cuit: '30-70182736-4', cond_iva: 'RI',   domicilio: 'San Martín 100, Mendoza' },
  { id: '5', razon_social: 'Juan Pérez',          cuit: '20-28765432-1', cond_iva: 'CF',   domicilio: '' },
  { id: '6', razon_social: 'María González',      cuit: '27-32145678-0', cond_iva: 'MONO', domicilio: '' },
  { id: '7', razon_social: 'Global Import Ltd',   cuit: '30-99876543-2', cond_iva: 'EX',   domicilio: 'Dock Sud, Avellaneda' },
]

const COND_IVA_ID: Record<string, number> = { RI: 1, EX: 4, CF: 5, MONO: 6 }

const TIPO_NC_ND = ['NCA', 'NCB', 'NCC', 'NDA', 'NDB']
const TIPO_LETRA: Record<string, string> = {
  FA: 'A', FB: 'B', FC: 'C', FE: 'E',
  NCA: 'A', NCB: 'B', NCC: 'C', NDA: 'A', NDB: 'B',
}
const TIPO_ASOCIADO: Record<string, string> = {
  NCA: 'FA', NCB: 'FB', NCC: 'FC', NDA: 'FA', NDB: 'FB',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0]
const fmt = (n: number) =>
  (n < 0 ? '- ' : '') + '$ ' +
  Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function validateTipoCliente(tipo: string, condIva: string): string | null {
  if (['FA', 'NCA', 'NDA'].includes(tipo) && condIva !== 'RI')
    return `Factura ${TIPO_LETRA[tipo]} solo puede emitirse a Responsables Inscriptos. Este cliente es ${condIva}.`
  if (['FB', 'NCB', 'NDB'].includes(tipo) && condIva === 'RI')
    return 'Para un RI usá Factura A.'
  if (['FC', 'NCC'].includes(tipo) && !['MONO', 'CF'].includes(condIva))
    return 'Factura C es para Monotributistas o Consumidores Finales.'
  return null
}

// ─── Tipos del form ────────────────────────────────────────────────────────────
interface Item {
  codigo: string
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  descuento: number
  alicuota_iva: number
}

interface ComprobanteForm {
  tipo: string
  punto_venta: string
  cliente_id: string
  concepto: number
  fecha: string
  moneda: string
  cotizacion: number
  fch_serv_desde: string
  fch_serv_hasta: string
  cbte_asoc_tipo: string
  cbte_asoc_pto_vta: string
  cbte_asoc_nro: string
  condicion_pago: string
  orden_compra: string
  descuento_global: number
  items: Item[]
  observaciones: string
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function NuevoComprobantePage() {
  const navigate = useNavigate()
  const [pdfGenerado, setPdfGenerado] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  const {
    register, control, handleSubmit, watch,
    formState: { isSubmitting },
  } = useForm<ComprobanteForm>({
    defaultValues: {
      tipo: 'FA',
      punto_venta: '0001',
      cliente_id: '',
      concepto: 2,
      fecha: today(),
      moneda: 'PES',
      cotizacion: 1,
      fch_serv_desde: today(),
      fch_serv_hasta: today(),
      cbte_asoc_tipo: 'FA',
      cbte_asoc_pto_vta: '0001',
      cbte_asoc_nro: '',
      condicion_pago: 'contado',
      orden_compra: '',
      descuento_global: 0,
      items: [{ codigo: '', descripcion: '', unidad: 'hs', cantidad: 1, precio_unitario: 0, descuento: 0, alicuota_iva: 21 }],
      observaciones: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Watchers reactivos
  const watchedItems      = useWatch({ control, name: 'items' })
  const watchedTipo       = useWatch({ control, name: 'tipo' })
  const watchedConcepto   = useWatch({ control, name: 'concepto' })
  const watchedMoneda     = useWatch({ control, name: 'moneda' })
  const watchedDescGlobal = useWatch({ control, name: 'descuento_global' })
  const clienteId         = watch('cliente_id')
  const cliente           = CLIENTES_MOCK.find((c) => c.id === clienteId)

  const esNcNd   = TIPO_NC_ND.includes(watchedTipo)
  const esServicio = watchedConcepto === 2 || watchedConcepto === 3
  const esMonedaExtranjera = watchedMoneda !== 'PES'

  const tipoWarning = cliente ? validateTipoCliente(watchedTipo, cliente.cond_iva) : null

  // Cálculos por alícuota
  const alicuotasDesglose = useMemo(() => {
    const map = new Map<number, { base_imp: number; importe: number }>()
    ;(watchedItems || []).forEach((item) => {
      const neto = Number(item.cantidad) * Number(item.precio_unitario) * (1 - Number(item.descuento || 0) / 100)
      const iva  = neto * Number(item.alicuota_iva) / 100
      const key  = Number(item.alicuota_iva)
      const prev = map.get(key) ?? { base_imp: 0, importe: 0 }
      map.set(key, { base_imp: prev.base_imp + neto, importe: prev.importe + iva })
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [watchedItems])

  const descFactor     = 1 - Number(watchedDescGlobal || 0) / 100
  const subtotalBruto  = alicuotasDesglose.reduce((s, [, v]) => s + v.base_imp, 0)
  const subtotalNeto   = subtotalBruto * descFactor
  const totalIVA       = alicuotasDesglose.reduce((s, [, v]) => s + v.importe, 0) * descFactor
  const total          = subtotalNeto + totalIVA

  // Construye el objeto PdfData desde el form
  const buildPdfData = (data: ComprobanteForm): PdfData => ({
    tipo: data.tipo,
    punto_venta: data.punto_venta,
    fecha: data.fecha,
    concepto: Number(data.concepto),
    fch_serv_desde: esServicio ? data.fch_serv_desde : undefined,
    fch_serv_hasta: esServicio ? data.fch_serv_hasta : undefined,
    cbte_asoc: esNcNd && data.cbte_asoc_nro ? {
      tipo: data.cbte_asoc_tipo,
      pto_vta: data.cbte_asoc_pto_vta,
      nro: data.cbte_asoc_nro,
    } : undefined,
    empresa: EMPRESA_MOCK,
    cliente: cliente ?? { razon_social: 'Sin seleccionar', cuit: '', cond_iva: '' },
    moneda: data.moneda,
    cotizacion: Number(data.cotizacion),
    condicion_pago: data.condicion_pago,
    orden_compra: data.orden_compra,
    items: (data.items || []).map((it) => ({
      codigo: it.codigo,
      descripcion: it.descripcion,
      unidad: it.unidad,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario),
      descuento: Number(it.descuento),
      alicuota_iva: Number(it.alicuota_iva),
    })),
    alicuotas_iva: alicuotasDesglose.map(([ali, v]) => ({
      alicuota: ali,
      base_imp: v.base_imp,
      importe: v.importe,
    })),
    imp_neto: subtotalNeto,
    imp_iva: totalIVA,
    imp_total: total,
    descuento_global: Number(data.descuento_global),
    observaciones: data.observaciones,
    estado: 'BORRADOR',
  })

  const handleGenerarPDF = handleSubmit((data) => {
    descargarPDF(buildPdfData(data))
    setPdfGenerado(true)
  })

  const handleUploadPDF = handleSubmit(async (data) => {
    setUploadingPdf(true)
    try {
      const blob = pdfToBlob(buildPdfData(data))
      const formData = new FormData()
      formData.append('file', blob, 'comprobante.pdf')
      // En producción: await api.post('/api/v1/documentos/upload?tipo=comprobante&empresa_id=...', formData)
      await new Promise((r) => setTimeout(r, 800))
      setPdfGenerado(true)
    } finally {
      setUploadingPdf(false)
    }
  })

  const onSubmit = async (data: ComprobanteForm) => {
    console.log('Emitir por ARCA:', data)
    await new Promise((r) => setTimeout(r, 1000))
    navigate('/app/comprobantes')
  }

  const onDraft = handleSubmit((data) => {
    console.log('Borrador:', data)
    navigate('/app/comprobantes')
  })

  // ─── UI helpers ──────────────────────────────────────────────────────────────
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'
  const sectionCls = 'bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4'

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo comprobante</h1>
          <p className="text-sm text-gray-400">Completá los datos y emitilo por ARCA</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Encabezado ─────────────────────────────────────────────── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-700">
            Encabezado
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Tipo de comprobante</label>
              <select {...register('tipo')} className={inputCls}>
                <optgroup label="Facturas">
                  <option value="FA">Factura A</option>
                  <option value="FB">Factura B</option>
                  <option value="FC">Factura C</option>
                  <option value="FE">Factura E — Exportación</option>
                </optgroup>
                <optgroup label="Notas de Crédito">
                  <option value="NCA">Nota de Crédito A</option>
                  <option value="NCB">Nota de Crédito B</option>
                  <option value="NCC">Nota de Crédito C</option>
                </optgroup>
                <optgroup label="Notas de Débito">
                  <option value="NDA">Nota de Débito A</option>
                  <option value="NDB">Nota de Débito B</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className={labelCls}>Punto de venta</label>
              <input {...register('punto_venta')} placeholder="0001" className={`${inputCls} font-mono`} />
            </div>

            <div>
              <label className={labelCls}>Fecha</label>
              <input {...register('fecha')} type="date" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Concepto</label>
              <select {...register('concepto', { valueAsNumber: true })} className={inputCls}>
                <option value={1}>Productos</option>
                <option value={2}>Servicios</option>
                <option value={3}>Productos y Servicios</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Moneda</label>
              <select {...register('moneda')} className={inputCls}>
                <option value="PES">ARS — Peso Argentino</option>
                <option value="DOL">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>

            {esMonedaExtranjera && (
              <div>
                <label className={labelCls}>Cotización (ARS)</label>
                <input
                  {...register('cotizacion', { valueAsNumber: true })}
                  type="number" min="0" step="0.0001"
                  className={`${inputCls} font-mono`}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Cond. de pago</label>
              <select {...register('condicion_pago')} className={inputCls}>
                <option value="contado">Contado</option>
                <option value="30">30 días</option>
                <option value="60">60 días</option>
                <option value="90">90 días</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>N° Orden de compra</label>
              <input {...register('orden_compra')} placeholder="OC-0001" className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Período de servicio (condicional) ──────────────────────── */}
        {esServicio && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
              <Calendar size={14} />
              Período del servicio
              <span className="text-xs font-normal text-blue-500 ml-1">(obligatorio para concepto Servicios)</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Fecha desde</label>
                <input {...register('fch_serv_desde')} type="date"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Fecha hasta</label>
                <input {...register('fch_serv_hasta')} type="date"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* ── Comprobante asociado (NC/ND) ───────────────────────────── */}
        {esNcNd && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <Link2 size={14} />
              Comprobante original asociado
              <span className="text-xs font-normal text-amber-600 ml-1">(obligatorio para NC/ND)</span>
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Tipo</label>
                <select {...register('cbte_asoc_tipo')}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="FA">Factura A</option>
                  <option value="FB">Factura B</option>
                  <option value="FC">Factura C</option>
                  <option value="FE">Factura E</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Pto. de venta</label>
                <input {...register('cbte_asoc_pto_vta')} placeholder="0001"
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Número</label>
                <input {...register('cbte_asoc_nro')} placeholder="00001240"
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* ── Cliente ────────────────────────────────────────────────── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-700">
            Cliente / Receptor
          </h2>
          <div>
            <label className={labelCls}>Seleccionar cliente</label>
            <select
              {...register('cliente_id', { required: true })}
              className={inputCls}
            >
              <option value="">— Seleccionar cliente —</option>
              {CLIENTES_MOCK.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social} — {c.cuit}
                </option>
              ))}
            </select>

            {cliente && (
              <div className="mt-2 flex flex-wrap gap-4 text-xs bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <span><span className="font-medium text-gray-700">CUIT:</span> {cliente.cuit}</span>
                <span><span className="font-medium text-gray-700">IVA:</span> {cliente.cond_iva}</span>
                <span><span className="font-medium text-gray-700">Cód. ARCA:</span> {COND_IVA_ID[cliente.cond_iva] ?? '?'}</span>
                {cliente.domicilio && (
                  <span><span className="font-medium text-gray-700">Dom:</span> {cliente.domicilio}</span>
                )}
              </div>
            )}

            {tipoWarning && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                <AlertTriangle size={12} className="shrink-0" />
                {tipoWarning}
              </div>
            )}
          </div>
        </div>

        {/* ── Ítems ──────────────────────────────────────────────────── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-700">
              Ítems
            </h2>
            <button
              type="button"
              onClick={() => append({ codigo: '', descripcion: '', unidad: 'hs', cantidad: 1, precio_unitario: 0, descuento: 0, alicuota_iva: 21 })}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={14} /> Agregar ítem
            </button>
          </div>

          {/* Cabecera de columnas */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] text-gray-400 uppercase tracking-wider px-1">
            <div className="col-span-4">Descripción / Código</div>
            <div className="col-span-1 text-right">Cant.</div>
            <div className="col-span-2 text-right">P. Unit.</div>
            <div className="col-span-1 text-right">Dto.%</div>
            <div className="col-span-2">IVA %</div>
            <div className="col-span-2 text-right">Subtotal neto</div>
          </div>

          {fields.map((field, i) => {
            const neto =
              Number(watchedItems?.[i]?.cantidad || 0) *
              Number(watchedItems?.[i]?.precio_unitario || 0) *
              (1 - Number(watchedItems?.[i]?.descuento || 0) / 100)

            return (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-lg p-3 border border-gray-100">
                {/* Descripción + Código + UM */}
                <div className="col-span-12 sm:col-span-4 space-y-1.5">
                  <input
                    {...register(`items.${i}.descripcion`)}
                    placeholder="Descripción del servicio/producto"
                    className={inputCls}
                  />
                  <div className="flex gap-2">
                    <input
                      {...register(`items.${i}.codigo`)}
                      placeholder="Código"
                      className={`${inputCls} w-24 font-mono text-xs`}
                    />
                    <input
                      {...register(`items.${i}.unidad`)}
                      placeholder="U.M."
                      className={`${inputCls} w-16 text-xs`}
                    />
                  </div>
                </div>

                {/* Cantidad */}
                <div className="col-span-3 sm:col-span-1">
                  <span className="block text-[10px] text-gray-400 mb-1 sm:hidden">Cant.</span>
                  <input
                    {...register(`items.${i}.cantidad`, { valueAsNumber: true })}
                    type="number" min="0.001" step="0.001"
                    className={`${inputCls} text-right`}
                  />
                </div>

                {/* Precio */}
                <div className="col-span-3 sm:col-span-2">
                  <span className="block text-[10px] text-gray-400 mb-1 sm:hidden">P. Unit.</span>
                  <input
                    {...register(`items.${i}.precio_unitario`, { valueAsNumber: true })}
                    type="number" min="0" step="0.01"
                    className={`${inputCls} text-right`}
                  />
                </div>

                {/* Descuento */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-gray-400 mb-1 sm:hidden">Dto.%</span>
                  <input
                    {...register(`items.${i}.descuento`, { valueAsNumber: true })}
                    type="number" min="0" max="100" step="0.1"
                    className={`${inputCls} text-right`}
                    placeholder="0"
                  />
                </div>

                {/* IVA */}
                <div className="col-span-4 sm:col-span-2">
                  <span className="block text-[10px] text-gray-400 mb-1 sm:hidden">IVA %</span>
                  <select {...register(`items.${i}.alicuota_iva`, { valueAsNumber: true })} className={inputCls}>
                    <option value={0}>0% (Exento)</option>
                    <option value={2.5}>2.5%</option>
                    <option value={5}>5%</option>
                    <option value={10.5}>10.5%</option>
                    <option value={21}>21%</option>
                    <option value={27}>27%</option>
                  </select>
                </div>

                {/* Subtotal neto */}
                <div className="col-span-10 sm:col-span-2 flex items-end justify-end">
                  <span className="text-sm font-semibold text-gray-700 font-mono mt-1">
                    {fmt(neto)}
                  </span>
                </div>

                {/* Eliminar */}
                <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Descuento global */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <label className="text-sm text-gray-600 font-medium">Descuento global:</label>
            <div className="flex items-center gap-1">
              <input
                {...register('descuento_global', { valueAsNumber: true })}
                type="number" min="0" max="100" step="0.1"
                placeholder="0"
                className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          {/* Totales desglosados */}
          <div className="border-t border-gray-100 pt-4 mt-1">
            <div className="ml-auto w-72 space-y-1.5">

              {/* Por alícuota */}
              {alicuotasDesglose.map(([ali, v]) => (
                <div key={ali} className="space-y-0.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Neto gravado {ali}%</span>
                    <span className="font-mono">{fmt(v.base_imp * descFactor)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>IVA {ali}%</span>
                    <span className="font-mono">{fmt(v.importe * descFactor)}</span>
                  </div>
                </div>
              ))}

              {/* Descuento */}
              {Number(watchedDescGlobal) > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Descuento {watchedDescGlobal}%</span>
                  <span className="font-mono">- {fmt(subtotalBruto * (Number(watchedDescGlobal) / 100))}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-500 pt-1 border-t border-gray-100">
                <span>Subtotal neto</span>
                <span className="font-medium font-mono">{fmt(subtotalNeto)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total IVA</span>
                <span className="font-medium font-mono">{fmt(totalIVA)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>TOTAL</span>
                <span className="font-mono">{fmt(total)}</span>
              </div>

              {esMonedaExtranjera && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                  <Info size={10} />
                  Moneda extranjera — cotización ARS: {watch('cotizacion')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Observaciones ──────────────────────────────────────────── */}
        <div className={sectionCls}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            {...register('observaciones')}
            rows={2}
            placeholder="Ej: Pago a 30 días, OC N° 1234, referencia interna…"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* ── Acciones ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            {/* Izquierda: PDF */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerarPDF}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileDown size={14} /> Generar PDF
              </button>
              <button
                type="button"
                onClick={handleUploadPDF}
                disabled={uploadingPdf}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Upload size={14} />
                {uploadingPdf ? 'Subiendo…' : 'Guardar PDF'}
              </button>
              {pdfGenerado && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 size={14} /> Listo
                </span>
              )}
            </div>

            {/* Derecha: borrador / emitir */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDraft}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Save size={14} /> Guardar borrador
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!tipoWarning}
                title={tipoWarning ?? ''}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 shadow-sm"
              >
                <Send size={14} />
                {isSubmitting ? 'Emitiendo…' : 'Emitir por ARCA'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Subir PDF externo ───────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
          <Upload size={14} />
          Adjuntar PDF externo (recibido del cliente o generado por otro sistema)
        </p>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <Upload size={13} />
          Seleccionar archivo PDF
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              // En producción: subir al backend
              const fd = new FormData()
              fd.append('file', file)
              console.log('Subir PDF externo:', file.name)
              alert(`PDF "${file.name}" listo para subir. Se guardará cuando integres el backend.`)
            }}
          />
        </label>
        <p className="text-xs text-gray-400 mt-2">Máximo 10 MB. El archivo queda guardado y asociado a este comprobante.</p>
      </div>
    </div>
  )
}
