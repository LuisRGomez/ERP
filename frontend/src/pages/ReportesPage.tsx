import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, BookOpen, TrendingUp, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const fmt = (n: number) =>
  '$' + Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const PERIODOS = ['Ene 2026','Feb 2026','Mar 2026','Abr 2026']

const DATA_MENSUAL = [
  { mes:'Ene', fa:1650000, fb:240000, fc:120000, nc:0       },
  { mes:'Feb', fa:1920000, fb:310000, fc:80000,  nc:-45000  },
  { mes:'Mar', fa:2140000, fb:280000, fc:95000,  nc:-60000  },
  { mes:'Abr', fa:2200000, fb:320000, fc:105000, nc:-85000  },
]

const DATA_IVA = [
  { mes:'Ene', debito:370455, credito:150200 },
  { mes:'Feb', debito:451260, credito:178000 },
  { mes:'Mar', debito:503740, credito:215600 },
  { mes:'Abr', debito:538810, credito:248600 },
]

const PIE_TIPOS = [
  { name: 'Factura A', value: 68, color: '#3b82f6' },
  { name: 'Factura B', value: 19, color: '#10b981' },
  { name: 'Factura C', value: 8,  color: '#f59e0b' },
  { name: 'Exportación', value: 3, color: '#8b5cf6' },
  { name: 'N/C y N/D', value: 2,  color: '#ef4444' },
]

const LIBRO_IVA = [
  { fecha:'01/04',tipo:'FA',nro:'0001-00001230',cliente:'ACME S.A.',neto:148760,iva21:31239,total:180000 },
  { fecha:'03/04',tipo:'FA',nro:'0001-00001231',cliente:'LogiTransport',neto:82644,iva21:17355,total:100000 },
  { fecha:'08/04',tipo:'FA',nro:'0001-00001233',cliente:'Inversiones Del Sur',neto:206611,iva21:43388,total:250000 },
  { fecha:'12/04',tipo:'FB',nro:'0001-00000890',cliente:'Carlos Rodríguez',neto:24793,iva21:5206,total:30000 },
  { fecha:'15/04',tipo:'FC',nro:'0001-00000231',cliente:'María González',neto:12000,iva21:0,total:12000 },
  { fecha:'18/04',tipo:'FA',nro:'0001-00001235',cliente:'LogiTransport S.A.',neto:82644,iva21:17355,total:100000 },
  { fecha:'20/04',tipo:'FA',nro:'0001-00001236',cliente:'Grupo Fernández',neto:161157,iva21:33842,total:195000 },
  { fecha:'23/04',tipo:'NCA',nro:'0001-00000046',cliente:'Inversiones Del Sur',neto:-23140,iva21:-4859,total:-28000 },
  { fecha:'27/04',tipo:'FA',nro:'0001-00001238',cliente:'Distribuidora Norte',neto:190082,iva21:39917,total:230000 },
  { fecha:'29/04',tipo:'FA',nro:'0001-00001239',cliente:'Tech Solutions SRL',neto:78512,iva21:16487,total:95000 },
  { fecha:'30/04',tipo:'FA',nro:'0001-00001240',cliente:'ACME S.A.',neto:148760,iva21:31239,total:180000 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="mb-0.5" style={{ color: p.color || p.fill }}>
          {p.name}: {fmt(Math.abs(p.value))}
        </p>
      ))}
    </div>
  )
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState('Abr 2026')
  const [tab, setTab] = useState<'resumen'|'libro'|'iva'>('resumen')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Análisis fiscal y contable</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {PERIODOS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <button className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key:'resumen', label:'Resumen', icon: TrendingUp },
          { key:'libro',   label:'Libro IVA Ventas', icon: BookOpen },
          { key:'iva',     label:'Posición IVA', icon: FileText },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ──── TAB: Resumen ──── */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label:'Facturado bruto', value:fmt(2625000),  color:'text-gray-900' },
              { label:'N/C emitidas',    value:`− ${fmt(85000)}`, color:'text-red-600' },
              { label:'Neto total',      value:fmt(2540000),  color:'text-brand-700' },
              { label:'IVA débito',      value:fmt(538810),   color:'text-orange-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{periodo}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Facturación por tipo — 4 meses</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DATA_MENSUAL} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fa" name="Factura A" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="fb" name="Factura B" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="fc" name="Factura C" fill="#f59e0b" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Mix por tipo</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={PIE_TIPOS} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {PIE_TIPOS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: FileSpreadsheet, label:'Export Excel', desc:'Libro IVA en formato .xlsx para el contador', color:'bg-emerald-50 text-emerald-700' },
              { icon: FileText,        label:'Export PDF',   desc:'Resumen ejecutivo en PDF imprimible',         color:'bg-red-50 text-red-700' },
              { icon: Clock,           label:'Export AFIP',  desc:'Archivo .txt para importar en AFIP Citi',    color:'bg-brand-50 text-brand-700' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <button
                key={label}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all text-left group"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── TAB: Libro IVA ──── */}
      {tab === 'libro' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Libro IVA Ventas — {periodo}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{LIBRO_IVA.length} comprobantes registrados</p>
            </div>
            <button className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
              <Download size={14} /> Exportar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium">Número</th>
                  <th className="text-left px-5 py-3 font-medium">Cliente</th>
                  <th className="text-right px-5 py-3 font-medium">Neto grav.</th>
                  <th className="text-right px-5 py-3 font-medium">IVA 21%</th>
                  <th className="text-right px-5 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {LIBRO_IVA.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{r.fecha}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-semibold">{r.tipo}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.nro}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{r.cliente}</td>
                    <td className={`px-5 py-3 text-right ${r.neto < 0 ? 'text-red-600' : 'text-gray-700'}`}>{fmt(r.neto)}</td>
                    <td className={`px-5 py-3 text-right ${r.iva21 < 0 ? 'text-red-500' : 'text-gray-500'}`}>{fmt(r.iva21)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${r.total < 0 ? 'text-red-600' : 'text-gray-900'}`}>{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-100 bg-gray-50 text-sm font-semibold">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-gray-700">TOTALES</td>
                  <td className="px-5 py-3 text-right text-gray-900">{fmt(LIBRO_IVA.reduce((s,r)=>s+r.neto,0))}</td>
                  <td className="px-5 py-3 text-right text-gray-900">{fmt(LIBRO_IVA.reduce((s,r)=>s+r.iva21,0))}</td>
                  <td className="px-5 py-3 text-right text-gray-900">{fmt(LIBRO_IVA.reduce((s,r)=>s+r.total,0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ──── TAB: IVA ──── */}
      {tab === 'iva' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Evolución débito vs crédito fiscal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DATA_IVA} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v)=>`${(v/1000).toFixed(0)}k`} tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="debito"  name="Débito"  fill="#ef4444" radius={[3,3,0,0]} />
                  <Bar dataKey="credito" name="Crédito" fill="#10b981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Posición IVA — {periodo}</h3>
              <div className="space-y-3">
                {[
                  { label:'IVA Débito Fiscal',   sub:'Por ventas realizadas',       val: 538810, color:'text-red-700',     neg:false },
                  { label:'IVA Crédito Fiscal',  sub:'Por compras a proveedores',   val:-248600, color:'text-emerald-700', neg:true  },
                ].map(({ label, sub, val, color, neg }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                    <span className={`text-lg font-bold ${color}`}>{neg && '− '}{fmt(Math.abs(val))}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-red-50 rounded-xl px-4 mt-2">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Saldo a pagar</p>
                    <p className="text-xs text-red-400">Vence aprox. 08/05/2026</p>
                  </div>
                  <span className="text-xl font-bold text-red-700">{fmt(538810 - 248600)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <strong>Importante:</strong> Los datos mostrados son estimaciones basadas en los comprobantes emitidos y recibidos registrados en el sistema. Para la DDJJ oficial utilizá el aplicativo AFIP Citi Ventas / Compras.
          </div>
        </div>
      )}
    </div>
  )
}
