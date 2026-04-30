import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Download, Eye, Mail, FileText,
  ChevronUp, ChevronDown, ChevronsUpDown, Filter,
  FileUp, CheckCircle2, X, Building2, User, Receipt,
  Hash, Calendar, DollarSign, ShieldCheck, Send,
} from 'lucide-react'
import { descargarPDF, type PdfData } from '@/utils/generarPDF'

const fmt = (n: number) =>
  '$' + Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Estado = 'EMITIDO' | 'BORRADOR' | 'PENDIENTE' | 'ERROR' | 'ANULADO'
type Tipo   = 'FA' | 'FB' | 'FC' | 'FE' | 'NCA' | 'NCB' | 'NCC' | 'NDA' | 'NDB'

interface Comprobante {
  id: string
  tipo: Tipo
  numero: string
  cliente: string
  cuit_cliente: string
  fecha: string
  imp_neto: number
  imp_iva: number
  imp_total: number
  estado: Estado
  cae: string | null
  email_enviado: boolean
}

const MOCK: Comprobante[] = [
  { id:'1',  tipo:'FA', numero:'0001-00001240', cliente:'ACME S.A.',           cuit_cliente:'30-71234567-8', fecha:'30/04/2026', imp_neto:148760.33, imp_iva:31239.67,  imp_total:180000,  estado:'EMITIDO',  cae:'73012345678901', email_enviado:true  },
  { id:'2',  tipo:'FA', numero:'0001-00001239', cliente:'Tech Solutions SRL',  cuit_cliente:'30-65432100-1', fecha:'29/04/2026', imp_neto:78512.40,  imp_iva:16487.60,  imp_total:95000,   estado:'EMITIDO',  cae:'73012345678902', email_enviado:true  },
  { id:'3',  tipo:'FB', numero:'0001-00000892', cliente:'Juan Pérez',          cuit_cliente:'20-28765432-1', fecha:'28/04/2026', imp_neto:37190.08,  imp_iva:7809.92,   imp_total:45000,   estado:'EMITIDO',  cae:'73012345678903', email_enviado:false },
  { id:'4',  tipo:'FA', numero:'0001-00001238', cliente:'Distribuidora Norte', cuit_cliente:'30-60998877-5', fecha:'27/04/2026', imp_neto:190082.64, imp_iva:39917.36,  imp_total:230000,  estado:'BORRADOR', cae:null,             email_enviado:false },
  { id:'5',  tipo:'NCA',numero:'0001-00000046', cliente:'Inversiones Del Sur', cuit_cliente:'30-70182736-4', fecha:'26/04/2026', imp_neto:-23140.50, imp_iva:-4859.50,  imp_total:-28000,  estado:'EMITIDO',  cae:'73012345678904', email_enviado:true  },
  { id:'6',  tipo:'FA', numero:'0001-00001237', cliente:'Grupo Fernández',     cuit_cliente:'23-14567890-9', fecha:'24/04/2026', imp_neto:161157.03, imp_iva:33842.97,  imp_total:195000,  estado:'EMITIDO',  cae:'73012345678905', email_enviado:true  },
  { id:'7',  tipo:'FC', numero:'0001-00000231', cliente:'María González',      cuit_cliente:'27-32145678-0', fecha:'23/04/2026', imp_neto:12000,     imp_iva:0,         imp_total:12000,   estado:'EMITIDO',  cae:'73012345678906', email_enviado:false },
  { id:'8',  tipo:'FA', numero:'0001-00001236', cliente:'ACME S.A.',           cuit_cliente:'30-71234567-8', fecha:'20/04/2026', imp_neto:247933.88, imp_iva:52066.12,  imp_total:300000,  estado:'EMITIDO',  cae:'73012345678907', email_enviado:true  },
  { id:'9',  tipo:'FA', numero:'0001-00001235', cliente:'LogiTransport S.A.',  cuit_cliente:'30-68123456-7', fecha:'18/04/2026', imp_neto:82644.63,  imp_iva:17355.37,  imp_total:100000,  estado:'ERROR',    cae:null,             email_enviado:false },
  { id:'10', tipo:'FB', numero:'0001-00000891', cliente:'Carlos Rodríguez',    cuit_cliente:'20-30456789-5', fecha:'15/04/2026', imp_neto:24793.39,  imp_iva:5206.61,   imp_total:30000,   estado:'EMITIDO',  cae:'73012345678908', email_enviado:true  },
  { id:'11', tipo:'FA', numero:'0001-00001234', cliente:'Tech Solutions SRL',  cuit_cliente:'30-65432100-1', fecha:'12/04/2026', imp_neto:123966.94, imp_iva:26033.06,  imp_total:150000,  estado:'ANULADO',  cae:'73012345678909', email_enviado:true  },
  { id:'12', tipo:'FE', numero:'0002-00000015', cliente:'Global Import Ltd',   cuit_cliente:'30-99876543-2', fecha:'10/04/2026', imp_neto:500000,    imp_iva:0,         imp_total:500000,  estado:'EMITIDO',  cae:'73012345678910', email_enviado:true  },
  { id:'13', tipo:'FA', numero:'0001-00001233', cliente:'Inversiones Del Sur', cuit_cliente:'30-70182736-4', fecha:'08/04/2026', imp_neto:206611.57, imp_iva:43388.43,  imp_total:250000,  estado:'EMITIDO',  cae:'73012345678911', email_enviado:false },
  { id:'14', tipo:'NDA',numero:'0001-00000012', cliente:'Distribuidora Norte', cuit_cliente:'30-60998877-5', fecha:'05/04/2026', imp_neto:8264.46,   imp_iva:1735.54,   imp_total:10000,   estado:'EMITIDO',  cae:'73012345678912', email_enviado:true  },
  { id:'15', tipo:'FB', numero:'0001-00000890', cliente:'Lucía Martínez',      cuit_cliente:'27-20876543-4', fecha:'03/04/2026', imp_neto:41322.31,  imp_iva:8677.69,   imp_total:50000,   estado:'PENDIENTE',cae:null,             email_enviado:false },
]

const TIPO_LABEL: Record<Tipo, string> = {
  FA:'Factura A', FB:'Factura B', FC:'Factura C', FE:'Factura E',
  NCA:'N/C A', NCB:'N/C B', NCC:'N/C C', NDA:'N/D A', NDB:'N/D B',
}

const estadoBadge: Record<Estado, string> = {
  EMITIDO:  'bg-emerald-100 text-emerald-700',
  BORRADOR: 'bg-gray-100   text-gray-600',
  PENDIENTE:'bg-yellow-100 text-yellow-700',
  ERROR:    'bg-red-100    text-red-600',
  ANULADO:  'bg-orange-100 text-orange-700',
}

type SortKey = 'fecha' | 'cliente' | 'imp_total'
type SortDir = 'asc' | 'desc'

// PDF mock data builder (en prod vendrá del backend)
function buildMockPdf(c: Comprobante): PdfData {
  return {
    tipo: c.tipo,
    punto_venta: c.numero.split('-')[0],
    numero: Number(c.numero.split('-')[1]),
    fecha: c.fecha.split('/').reverse().join('-'),
    concepto: 2,
    empresa: {
      razon_social: 'Mi Empresa S.A.',
      cuit: '30-71234567-8',
      domicilio: 'Av. Corrientes 1234, CABA',
      cond_iva: 'RI',
      inicio_actividades: '2015-03-01',
      iibb: '901-123456-0',
    },
    cliente: { razon_social: c.cliente, cuit: c.cuit_cliente, cond_iva: 'RI' },
    moneda: 'PES',
    items: [
      { descripcion: 'Servicios profesionales', cantidad: 1, precio_unitario: c.imp_neto, alicuota_iva: 21 },
    ],
    alicuotas_iva: [{ alicuota: 21, base_imp: c.imp_neto, importe: c.imp_iva }],
    imp_neto: c.imp_neto,
    imp_iva: c.imp_iva,
    imp_total: c.imp_total,
    cae: c.cae ?? undefined,
    estado: c.estado,
  }
}

export default function ComprobantesPage() {
  const [search,  setSearch]  = useState('')
  const [tipoF,   setTipoF]   = useState('TODOS')
  const [estadoF, setEstadoF] = useState('TODOS')
  const [sort,    setSort]    = useState<{ key: SortKey; dir: SortDir }>({ key:'fecha', dir:'desc' })
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set())
  const uploadRef = useRef<HTMLInputElement>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<Comprobante | null>(null)

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    )

  const filtered = useMemo(() => {
    let list = MOCK
    if (search)           list = list.filter((c) => c.cliente.toLowerCase().includes(search.toLowerCase()) || c.numero.includes(search))
    if (tipoF   !== 'TODOS') list = list.filter((c) => c.tipo   === tipoF)
    if (estadoF !== 'TODOS') list = list.filter((c) => c.estado === estadoF)
    return [...list].sort((a, b) => {
      let va: string | number = a[sort.key]
      let vb: string | number = b[sort.key]
      if (sort.key === 'fecha') {
        const p = (d: string) => d.split('/').reverse().join('')
        va = p(a.fecha); vb = p(b.fecha)
      }
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
  }, [search, tipoF, estadoF, sort])

  // Totales sobre filtrado
  const totalFacturado = filtered.filter((c) => c.imp_total > 0 && c.estado !== 'ANULADO' && c.estado !== 'BORRADOR').reduce((s, c) => s + c.imp_total, 0)
  const totalNC = filtered.filter((c) => c.imp_total < 0).reduce((s, c) => s + c.imp_total, 0)
  const emitidos = filtered.filter((c) => c.estado === 'EMITIDO').length

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key === k
      ? sort.dir === 'asc' ? <ChevronUp size={13} className="text-brand-500" /> : <ChevronDown size={13} className="text-brand-500" />
      : <ChevronsUpDown size={13} className="text-gray-300" />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes emitidos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión de facturas, notas de crédito y débito</p>
        </div>
        <Link
          to="/app/comprobantes/nuevo"
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo comprobante
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Facturado (filtro)</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalFacturado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notas de crédito</p>
          <p className="text-xl font-bold text-red-600">{totalNC < 0 ? '−' : ''}{fmt(Math.abs(totalNC))}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Comprobantes emitidos</p>
          <p className="text-xl font-bold text-emerald-700">{emitidos}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o número..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select
              value={tipoF}
              onChange={(e) => setTipoF(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="TODOS">Todos los tipos</option>
              {(Object.keys(TIPO_LABEL) as Tipo[]).map((t) => (
                <option key={t} value={t}>{TIPO_LABEL[t]}</option>
              ))}
            </select>
            <select
              value={estadoF}
              onChange={(e) => setEstadoF(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="TODOS">Todos los estados</option>
              {(['EMITIDO','BORRADOR','PENDIENTE','ERROR','ANULADO'] as Estado[]).map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 font-medium">Número</th>
                <th
                  className="text-left px-5 py-3 font-medium cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('cliente')}
                >
                  <span className="flex items-center gap-1">Cliente <SortIcon k="cliente" /></span>
                </th>
                <th
                  className="text-right px-5 py-3 font-medium cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('fecha')}
                >
                  <span className="flex items-center gap-1 justify-end">Fecha <SortIcon k="fecha" /></span>
                </th>
                <th className="text-right px-5 py-3 font-medium">Neto</th>
                <th className="text-right px-5 py-3 font-medium">IVA</th>
                <th
                  className="text-right px-5 py-3 font-medium cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('imp_total')}
                >
                  <span className="flex items-center gap-1 justify-end">Total <SortIcon k="imp_total" /></span>
                </th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
                <th className="text-center px-5 py-3 font-medium">CAE</th>
                <th className="text-right px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    No se encontraron comprobantes
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.estado === 'ANULADO' ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-semibold">
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">{c.numero}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{c.cliente}</p>
                      <p className="text-xs text-gray-400">{c.cuit_cliente}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500 whitespace-nowrap">{c.fecha}</td>
                    <td className={`px-5 py-3.5 text-right font-medium whitespace-nowrap ${c.imp_neto < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {fmt(c.imp_neto)}
                    </td>
                    <td className={`px-5 py-3.5 text-right text-gray-500 whitespace-nowrap ${c.imp_iva < 0 ? 'text-red-400' : ''}`}>
                      {fmt(c.imp_iva)}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${c.imp_total < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {c.imp_total < 0 ? '−' : ''}{fmt(Math.abs(c.imp_total))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge[c.estado]}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {c.cae ? (
                        <span className="font-mono text-[10px] text-gray-400">{c.cae.slice(-6)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          title="Ver detalle"
                          onClick={() => setDetalle(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Descargar PDF generado */}
                        <button
                          title="Descargar PDF"
                          onClick={() => descargarPDF(buildMockPdf(c))}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                        >
                          <Download size={14} />
                        </button>

                        {/* Subir PDF externo */}
                        <label
                          title={uploadedIds.has(c.id) ? 'PDF subido ✓' : 'Subir PDF externo'}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            uploadedIds.has(c.id)
                              ? 'text-emerald-500 bg-emerald-50'
                              : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          onClick={() => setUploadingFor(c.id)}
                        >
                          {uploadedIds.has(c.id) ? <CheckCircle2 size={14} /> : <FileUp size={14} />}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              // En producción: POST /api/v1/documentos/upload
                              const fd = new FormData()
                              fd.append('file', file)
                              console.log(`Subir PDF para cbte ${c.id}:`, file.name)
                              await new Promise((r) => setTimeout(r, 500))
                              setUploadedIds((prev) => new Set([...prev, c.id]))
                              e.target.value = ''
                            }}
                          />
                        </label>

                        {c.estado === 'EMITIDO' && (
                          <button
                            title={c.email_enviado ? 'Reenviar email' : 'Enviar por email'}
                            className={`p-1.5 rounded-lg transition-all ${c.email_enviado ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'}`}
                          >
                            <Mail size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
            <span>Mostrando {filtered.length} de {MOCK.length} comprobantes</span>
            <span className="font-semibold text-gray-600">
              Total neto: {fmt(filtered.filter(c => c.estado !== 'ANULADO').reduce((s, c) => s + c.imp_neto, 0))}
            </span>
          </div>
        )}
      </div>

      {/* ── Modal Detalle ─────────────────────────────────────────────────── */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Receipt size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">
                    {TIPO_LABEL[detalle.tipo]} · <span className="font-mono">{detalle.numero}</span>
                  </p>
                  <p className="text-xs text-gray-400">{detalle.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoBadge[detalle.estado]}`}>
                  {detalle.estado}
                </span>
                <button
                  onClick={() => setDetalle(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Empresa emisora */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 size={11} /> Emisor
                  </p>
                  <p className="text-sm font-semibold text-gray-800">Mi Empresa S.A.</p>
                  <p className="text-xs text-gray-500 font-mono">30-71234567-8</p>
                  <p className="text-xs text-gray-400">Av. Corrientes 1234, CABA</p>
                  <p className="text-xs text-gray-400">Responsable Inscripto</p>
                </div>

                {/* Cliente receptor */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={11} /> Receptor
                  </p>
                  <p className="text-sm font-semibold text-gray-800">{detalle.cliente}</p>
                  <p className="text-xs text-gray-500 font-mono">{detalle.cuit_cliente}</p>
                </div>
              </div>

              {/* Comprobante */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Hash size={11} /> Datos del comprobante
                  </p>
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-50">
                  {[
                    { label: 'Tipo',        value: TIPO_LABEL[detalle.tipo],          icon: FileText  },
                    { label: 'Número',      value: detalle.numero,                    icon: Hash, mono: true },
                    { label: 'Fecha',       value: detalle.fecha,                     icon: Calendar  },
                  ].map(({ label, value, icon: Icon, mono }) => (
                    <div key={label} className="px-4 py-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                        <Icon size={10} /> {label}
                      </p>
                      <p className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Item mock */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ítems</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-50">
                      <th className="text-left px-4 py-2">Descripción</th>
                      <th className="text-right px-4 py-2">Cant.</th>
                      <th className="text-right px-4 py-2">Precio unit.</th>
                      <th className="text-right px-4 py-2">IVA</th>
                      <th className="text-right px-4 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-700">Servicios profesionales</td>
                      <td className="px-4 py-3 text-right text-gray-500">1</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(detalle.imp_neto)}</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">21%</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{fmt(detalle.imp_neto)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <DollarSign size={13} className="text-gray-400" />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Totales</p>
                </div>
                <div className="space-y-1.5 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal neto</span>
                    <span className="font-mono">{fmt(detalle.imp_neto)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA 21%</span>
                    <span className="font-mono">{fmt(detalle.imp_iva)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="font-mono text-base">{fmt(Math.abs(detalle.imp_total))}</span>
                  </div>
                </div>
              </div>

              {/* CAE */}
              {detalle.cae && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">Comprobante autorizado por ARCA</p>
                    <p className="font-mono text-sm text-emerald-700 mt-0.5">CAE: {detalle.cae}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer acciones */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {detalle.email_enviado ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 size={13} /> Email enviado
                  </span>
                ) : (
                  <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                    <Send size={12} /> Enviar por email
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetalle(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => { descargarPDF(buildMockPdf(detalle)); }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  <Download size={13} /> Descargar PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
