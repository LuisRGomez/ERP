import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const fmt = (n: number) =>
  '$' + Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtPct = (n: number) => n.toFixed(1) + '%'

const ventasMensuales = [
  { mes: 'May 25', actual: 1820000, anterior: 1540000 },
  { mes: 'Jun 25', actual: 2100000, anterior: 1780000 },
  { mes: 'Jul 25', actual: 1650000, anterior: 1690000 },
  { mes: 'Ago 25', actual: 2300000, anterior: 1950000 },
  { mes: 'Sep 25', actual: 1950000, anterior: 1820000 },
  { mes: 'Oct 25', actual: 2450000, anterior: 2100000 },
  { mes: 'Nov 25', actual: 2700000, anterior: 2280000 },
  { mes: 'Dic 25', actual: 3100000, anterior: 2690000 },
  { mes: 'Ene 26', actual: 2200000, anterior: 1980000 },
  { mes: 'Feb 26', actual: 2500000, anterior: 2150000 },
  { mes: 'Mar 26', actual: 2780000, anterior: 2340000 },
  { mes: 'Abr 26', actual: 2840500, anterior: 2530000 },
]

const ivaData = [
  { periodo: 'May 25', debito: 214800, credito: 95400, saldo: 119400 },
  { periodo: 'Jun 25', debito: 247800, credito: 118600, saldo: 129200 },
  { periodo: 'Jul 25', debito: 194700, credito: 102300, saldo: 92400 },
  { periodo: 'Ago 25', debito: 271400, credito: 134800, saldo: 136600 },
  { periodo: 'Sep 25', debito: 230100, credito: 108500, saldo: 121600 },
  { periodo: 'Oct 25', debito: 289050, credito: 142300, saldo: 146750 },
  { periodo: 'Nov 25', debito: 318600, credito: 156900, saldo: 161700 },
  { periodo: 'Dic 25', debito: 365800, credito: 178400, saldo: 187400 },
  { periodo: 'Ene 26', debito: 259600, credito: 118300, saldo: 141300 },
  { periodo: 'Feb 26', debito: 295000, credito: 131000, saldo: 164000 },
  { periodo: 'Mar 26', debito: 328040, credito: 145800, saldo: 182240 },
  { periodo: 'Abr 26', debito: 248600, credito: 124300, saldo: 124300 },
]

const deudores = [
  { cliente: 'ACME S.A.',           dias: 32, monto: 320000, riesgo: 'MEDIO' },
  { cliente: 'Inversiones Del Sur', dias: 68, monto: 210000, riesgo: 'ALTO'  },
  { cliente: 'Distribuidora Norte', dias: 15, monto: 95000,  riesgo: 'BAJO'  },
  { cliente: 'Grupo Fernández',     dias: 92, monto: 60500,  riesgo: 'ALTO'  },
  { cliente: 'Otros',               dias: 22, monto: 55000,  riesgo: 'BAJO'  },
]

const pieTipos = [
  { name: 'Factura A', value: 1520000, color: '#2563eb' },
  { name: 'Factura B', value: 840500,  color: '#10b981' },
  { name: 'Factura C', value: 480000,  color: '#f59e0b' },
]

const riesgoBadge: Record<string, string> = {
  BAJO:  'bg-emerald-100 text-emerald-700',
  MEDIO: 'bg-yellow-100 text-yellow-700',
  ALTO:  'bg-red-100 text-red-700',
}

const TABS = ['Ventas', 'IVA', 'Cobranza', 'Comparativo']

export default function KPIsPage() {
  const [tab, setTab] = useState(0)

  const totalActual  = ventasMensuales.reduce((s, m) => s + m.actual, 0)
  const totalAnterior = ventasMensuales.reduce((s, m) => s + m.anterior, 0)
  const promedio = totalActual / 12
  const mejor = Math.max(...ventasMensuales.map((m) => m.actual))
  const peor  = Math.min(...ventasMensuales.map((m) => m.actual))
  const proyeccion = promedio * 12

  const totalIvaDebito  = ivaData.reduce((s, m) => s + m.debito, 0)
  const totalIvaCredito = ivaData.reduce((s, m) => s + m.credito, 0)
  const totalIvaSaldo   = ivaData.reduce((s, m) => s + m.saldo, 0)

  const totalDeuda = deudores.reduce((s, d) => s + d.monto, 0)
  const tasaCobro  = 74.1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Avanzados</h1>
        <p className="text-sm text-gray-500 mt-0.5">Métricas detalladas para tu contador</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Ventas */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Promedio mensual" value={fmt(promedio)} />
            <KpiCard label="Mejor mes" value={fmt(mejor)} sub="Diciembre 2025" positive />
            <KpiCard label="Peor mes" value={fmt(peor)} sub="Julio 2025" />
            <KpiCard label="Proyección anual" value={fmt(proyeccion)} sub={`Crecimiento ${fmtPct(((totalActual-totalAnterior)/totalAnterior)*100)} vs año ant.`} positive />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Evolución de ventas — 12 meses</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Por tipo de comprobante</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieTipos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pieTipos.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab IVA */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Total débito fiscal" value={fmt(totalIvaDebito)} sub="Por ventas 12 meses" />
            <KpiCard label="Total crédito fiscal" value={fmt(totalIvaCredito)} sub="Por compras 12 meses" positive />
            <KpiCard label="Total pagado a AFIP" value={fmt(totalIvaSaldo)} sub="Saldo acumulado" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Posición IVA mensual — 2025/2026</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    <th className="text-left px-6 py-3">Período</th>
                    <th className="text-right px-6 py-3">Débito Fiscal</th>
                    <th className="text-right px-6 py-3">Crédito Fiscal</th>
                    <th className="text-right px-6 py-3">Saldo</th>
                    <th className="text-center px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ivaData.map((row, i) => (
                    <tr key={row.periodo} className={`hover:bg-gray-50 ${i === ivaData.length - 1 ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-3 font-medium text-gray-800">{row.periodo}</td>
                      <td className="px-6 py-3 text-right text-gray-700">{fmt(row.debito)}</td>
                      <td className="px-6 py-3 text-right text-emerald-600">− {fmt(row.credito)}</td>
                      <td className="px-6 py-3 text-right font-bold text-red-700">{fmt(row.saldo)}</td>
                      <td className="px-6 py-3 text-center">
                        {i === ivaData.length - 1
                          ? <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">PENDIENTE</span>
                          : <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">PAGADO</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr className="font-bold text-gray-900">
                    <td className="px-6 py-3">TOTAL</td>
                    <td className="px-6 py-3 text-right">{fmt(totalIvaDebito)}</td>
                    <td className="px-6 py-3 text-right text-emerald-700">− {fmt(totalIvaCredito)}</td>
                    <td className="px-6 py-3 text-right text-red-700">{fmt(totalIvaSaldo)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Cobranza */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm col-span-1">
              <p className="text-sm text-gray-500 mb-3">Tasa de cobro</p>
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${tasaCobro} ${100 - tasaCobro}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{tasaCobro}%</span>
                </div>
              </div>
              <p className="text-xs text-center text-gray-500">del facturado fue cobrado</p>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <KpiCard label="Total facturado" value={fmt(2840500)} />
              <KpiCard label="Total cobrado" value={fmt(2100000)} positive />
              <KpiCard label="En mora" value={fmt(totalDeuda)} sub="Pendiente de cobro" />
              <KpiCard label="Deudores activos" value={deudores.length.toString()} sub="clientes con saldo" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Deudores por antigüedad</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-50">
                  <th className="text-left px-6 py-3">Cliente</th>
                  <th className="text-right px-6 py-3">Días mora</th>
                  <th className="text-right px-6 py-3">Saldo</th>
                  <th className="text-center px-6 py-3">Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deudores.map((d) => (
                  <tr key={d.cliente} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{d.cliente}</td>
                    <td className={`px-6 py-3 text-right font-semibold ${d.dias > 60 ? 'text-red-600' : d.dias > 30 ? 'text-yellow-600' : 'text-gray-700'}`}>{d.dias} días</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{fmt(d.monto)}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${riesgoBadge[d.riesgo]}`}>{d.riesgo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Comparativo */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Crecimiento anual" value={fmtPct(((totalActual - totalAnterior) / totalAnterior) * 100)} sub="vs mismo período año anterior" positive />
            <KpiCard label="Año actual" value={fmt(totalActual)} sub="Mayo 25 – Abril 26" />
            <KpiCard label="Año anterior" value={fmt(totalAnterior)} sub="Mayo 24 – Abril 25" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Comparativo año actual vs anterior</h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-brand-500 inline-block" /> 2025/26</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-gray-300 inline-block" /> 2024/25</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ventasMensuales} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="actual"   name="2025/26" fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="anterior" name="2024/25" fill="#cbd5e1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${positive ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
      {sub && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          {positive ? <TrendingUp size={11} className="text-emerald-500" /> : <TrendingDown size={11} className="text-gray-400" />}
          {sub}
        </p>
      )}
    </div>
  )
}
