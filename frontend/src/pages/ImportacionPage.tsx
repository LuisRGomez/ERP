import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, Download,
  ChevronDown, ChevronRight, Info, Loader2, Table2, RefreshCw,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type EstadoFila = 'ok' | 'error' | 'advertencia' | 'importado'

interface FilaCSV {
  id: number
  fila: number
  tipo: string
  fecha: string
  cliente: string
  cuit_receptor: string
  pto_venta: string
  numero: string
  neto: string
  iva: string
  total: string
  estado: EstadoFila
  errores: string[]
}

// Plantilla CSV con los campos requeridos
const COLUMNAS_PLANTILLA = [
  'tipo_cbte',     // FA / FB / FC / FE / NCA / NCB / NCC / NDA / NDB
  'fecha',         // YYYY-MM-DD
  'pto_venta',     // 0001
  'numero',        // 00000001
  'cuit_receptor',
  'razon_social',
  'condicion_iva', // RI / MONO / EX / CF
  'descripcion',
  'cantidad',
  'precio_unitario',
  'alicuota_iva',  // 0 / 2.5 / 5 / 10.5 / 21 / 27
  'descuento_pct', // 0–100
  'concepto',      // 1=Productos / 2=Servicios / 3=Ambos
  'moneda',        // ARS / USD / EUR
  'tipo_cambio',   // 1 si ARS
  'cae',           // opcional
  'cae_vto',       // YYYYMMDD opcional
]

const CSV_EJEMPLO = `tipo_cbte,fecha,pto_venta,numero,cuit_receptor,razon_social,condicion_iva,descripcion,cantidad,precio_unitario,alicuota_iva,descuento_pct,concepto,moneda,tipo_cambio,cae,cae_vto
FA,2026-04-01,0001,00000001,20301234567,ACME S.A.,RI,Servicios de consultoría,1,100000,21,0,2,ARS,1,12345678901234,20260430
FB,2026-04-05,0001,00000002,27987654321,Juan Pérez,CF,Venta de equipamiento,2,50000,21,10,1,ARS,1,,
FC,2026-04-10,0001,00000003,20111222333,María García,MONO,Servicio mensual,1,25000,0,0,2,ARS,1,98765432109876,20260510`

// ─── Parseo mock del CSV ──────────────────────────────────────────────────────
const parsearCSV = (texto: string): FilaCSV[] => {
  const lines = texto.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  const rows: FilaCSV[] = []

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',').map(c => c.trim())
    const get = (col: string) => cols[headers.indexOf(col)] ?? ''

    const errores: string[] = []
    const tipo = get('tipo_cbte')
    const fecha = get('fecha')
    const cuit = get('cuit_receptor')
    const neto = parseFloat(get('precio_unitario')) * parseFloat(get('cantidad') || '1')
    const alicuota = parseFloat(get('alicuota_iva') || '0')
    const iva = neto * alicuota / 100
    const total = neto + iva

    // Validaciones básicas
    if (!['FA','FB','FC','FE','NCA','NCB','NCC','NDA','NDB'].includes(tipo)) errores.push(`Tipo "${tipo}" no reconocido`)
    if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) errores.push('Fecha inválida (esperado YYYY-MM-DD)')
    if (!cuit || cuit.length < 10) errores.push('CUIT inválido')
    if (isNaN(neto) || neto <= 0) errores.push('Precio o cantidad inválidos')

    rows.push({
      id: idx + 1,
      fila: idx + 2,
      tipo,
      fecha,
      cliente: get('razon_social'),
      cuit_receptor: cuit,
      pto_venta: get('pto_venta'),
      numero: get('numero'),
      neto: isNaN(neto) ? '-' : neto.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      iva: isNaN(iva) ? '-' : iva.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      total: isNaN(total) ? '-' : total.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      estado: errores.length > 0 ? 'error' : 'ok',
      errores,
    })
  })
  return rows
}

const ESTADO_BADGE: Record<EstadoFila, { label: string; cls: string }> = {
  ok:          { label: 'Listo',     cls: 'bg-emerald-50 text-emerald-700' },
  error:       { label: 'Error',     cls: 'bg-red-50 text-red-700'         },
  advertencia: { label: 'Advertencia', cls: 'bg-amber-50 text-amber-700'   },
  importado:   { label: 'Importado', cls: 'bg-gray-100 text-gray-500'      },
}

export default function ImportacionPage() {
  const [stage, setStage] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [filas, setFilas] = useState<FilaCSV[]>([])
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [filtroEstado, setFiltroEstado] = useState<EstadoFila | 'todos'>('todos')
  const [showColumnas, setShowColumnas] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = {
    total:    filas.length,
    ok:       filas.filter(f => f.estado === 'ok' || f.estado === 'importado').length,
    errores:  filas.filter(f => f.estado === 'error').length,
    advertencias: filas.filter(f => f.estado === 'advertencia').length,
  }

  const procesarArchivo = (file: File) => {
    if (!file.name.endsWith('.csv')) { alert('Solo se aceptan archivos .csv'); return }
    if (file.size > 5 * 1024 * 1024) { alert('El archivo supera los 5 MB'); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parsearCSV(text)
      setFilas(parsed)
      setStage('preview')
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) procesarArchivo(file)
  }, [])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const iniciarImportacion = () => {
    if (stats.errores > 0) { alert('Corregí los errores antes de importar'); return }
    setStage('importing')
    setImportProgress(0)
    const total = filas.filter(f => f.estado === 'ok').length
    let done = 0
    const interval = setInterval(() => {
      done++
      setImportProgress(Math.round((done / total) * 100))
      setFilas(prev => {
        const updated = [...prev]
        const idx = updated.findIndex(f => f.estado === 'ok' && updated.indexOf(f) <= done)
        if (idx !== -1) updated[idx] = { ...updated[idx], estado: 'importado' }
        return updated
      })
      if (done >= total) {
        clearInterval(interval)
        setStage('done')
      }
    }, 60)
  }

  const descargarPlantilla = () => {
    const blob = new Blob([CSV_EJEMPLO], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_importacion_facturas.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  const resetear = () => {
    setStage('upload'); setFilas([]); setFileName(''); setImportProgress(0)
    setFiltroEstado('todos'); setExpandedRow(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const filasFiltradas = filtroEstado === 'todos' ? filas : filas.filter(f => f.estado === filtroEstado)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importación masiva</h1>
          <p className="text-sm text-gray-400 mt-0.5">Cargá múltiples comprobantes desde un archivo CSV</p>
        </div>
        {stage !== 'upload' && (
          <button onClick={resetear} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Nueva importación
          </button>
        )}
      </div>

      {/* ── STAGE: UPLOAD ──────────────────────────────────────────────────── */}
      {stage === 'upload' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Drop zone */}
          <div className="col-span-2">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-brand-100' : 'bg-gray-100'}`}>
                <Upload size={28} className={isDragging ? 'text-brand-600' : 'text-gray-400'} />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {isDragging ? 'Soltá el archivo acá' : 'Arrastrá tu CSV o hacé clic para seleccionar'}
              </p>
              <p className="text-sm text-gray-400">Archivos .csv · máx. 5 MB</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            </div>

            {/* Pasos */}
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { n: 1, title: 'Descargá la plantilla', desc: 'Formato CSV con todas las columnas requeridas' },
                { n: 2, title: 'Completá los datos',    desc: 'Un comprobante por fila. Guardá como CSV UTF-8' },
                { n: 3, title: 'Subí el archivo',       desc: 'Validamos antes de importar. Podés corregir errores' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold mb-2">{n}</div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Plantilla CSV</p>
              <p className="text-xs text-gray-500 mb-4">Descargá el archivo de ejemplo con datos de muestra y los campos requeridos.</p>
              <button
                onClick={descargarPlantilla}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <Download size={14} /> Descargar plantilla
              </button>
            </div>

            {/* Columnas */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowColumnas(!showColumnas)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2"><Table2 size={15} className="text-gray-400" /> Columnas requeridas</span>
                {showColumnas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showColumnas && (
                <div className="px-5 pb-4">
                  <div className="space-y-1">
                    {COLUMNAS_PLANTILLA.map(col => (
                      <div key={col} className="flex items-center gap-2 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                        <code className="text-xs font-mono text-gray-700">{col}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Si tenés comprobantes con <strong>múltiples ítems</strong>, repetí la misma fila con el mismo número de comprobante. Los ítems se agrupan automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE: PREVIEW ─────────────────────────────────────────────────── */}
      {(stage === 'preview' || stage === 'done') && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total filas',  value: stats.total,    color: 'gray',    icon: FileText   },
              { label: 'Listos',       value: stats.ok,       color: 'emerald', icon: CheckCircle2 },
              { label: 'Errores',      value: stats.errores,  color: 'red',     icon: AlertCircle },
              { label: 'Advertencias', value: stats.advertencias, color: 'amber', icon: AlertCircle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center shrink-0`}>
                  <Icon size={16} className={`text-${color}-600`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Archivo + acciones */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-400">{stats.total} filas detectadas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stage === 'done' ? (
                <span className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 size={16} /> Importación completada
                </span>
              ) : (
                <>
                  {stats.errores > 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      Corregí {stats.errores} {stats.errores === 1 ? 'error' : 'errores'} antes de importar
                    </span>
                  )}
                  <button
                    onClick={iniciarImportacion}
                    disabled={stats.errores > 0 || stats.ok === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    <Upload size={14} /> Importar {stats.ok} comprobante{stats.ok !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filtro */}
          <div className="flex gap-2">
            {([['todos', 'Todos'], ['ok', 'Listos'], ['error', 'Errores'], ['advertencia', 'Advertencias'], ['importado', 'Importados']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFiltroEstado(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroEstado === key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
                {key !== 'todos' && <span className="ml-1.5 opacity-70">{
                  key === 'ok'         ? stats.ok :
                  key === 'error'      ? stats.errores :
                  key === 'advertencia'? stats.advertencias :
                  filas.filter(f => f.estado === 'importado').length
                }</span>}
              </button>
            ))}
          </div>

          {/* Tabla preview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide w-12">Fila</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">PV / N°</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Neto</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">Sin resultados</td></tr>
                )}
                {filasFiltradas.map(f => (
                  <>
                    <tr
                      key={f.id}
                      onClick={() => f.errores.length > 0 && setExpandedRow(expandedRow === f.id ? null : f.id)}
                      className={`border-b border-gray-50 last:border-0 transition-colors ${f.errores.length > 0 ? 'cursor-pointer hover:bg-red-50/30' : 'hover:bg-gray-50/50'}`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{f.fila}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{f.tipo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{f.fecha}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800 truncate max-w-[160px]">{f.cliente || '—'}</p>
                        <p className="text-xs text-gray-400 font-mono">{f.cuit_receptor}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{f.pto_venta}-{f.numero}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-700">{f.neto}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900">{f.total}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ESTADO_BADGE[f.estado].cls}`}>
                            {ESTADO_BADGE[f.estado].label}
                          </span>
                          {f.errores.length > 0 && (
                            expandedRow === f.id
                              ? <ChevronDown size={12} className="text-red-500" />
                              : <ChevronRight size={12} className="text-red-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === f.id && f.errores.length > 0 && (
                      <tr key={`${f.id}-err`} className="bg-red-50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <ul className="text-xs text-red-700 space-y-0.5">
                              {f.errores.map((err, i) => <li key={i}>• {err}</li>)}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── STAGE: IMPORTING ───────────────────────────────────────────────── */}
      {stage === 'importing' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
            <Loader2 size={28} className="text-brand-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Importando comprobantes…</h2>
          <p className="text-sm text-gray-400 mb-6">No cierres esta ventana hasta que finalice</p>
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progreso</span>
              <span>{importProgress}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-200"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
