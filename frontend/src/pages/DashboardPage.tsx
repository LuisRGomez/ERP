import { TrendingUp, TrendingDown, FileText, Clock, AlertCircle, ArrowUpRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const fmt = (n: number) =>
  '$' + Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const chartData = [
  { mes: 'May', facturado: 1820000, cobrado: 1450000 },
  { mes: 'Jun', facturado: 2100000, cobrado: 1890000 },
  { mes: 'Jul', facturado: 1650000, cobrado: 1600000 },
  { mes: 'Ago', facturado: 2300000, cobrado: 1980000 },
  { mes: 'Sep', facturado: 1950000, cobrado: 1750000 },
  { mes: 'Oct', facturado: 2450000, cobrado: 2100000 },
  { mes: 'Nov', facturado: 2700000, cobrado: 2400000 },
  { mes: 'Dic', facturado: 3100000, cobrado: 2600000 },
  { mes: 'Ene', facturado: 2200000, cobrado: 1900000 },
  { mes: 'Feb', facturado: 2500000, cobrado: 2200000 },
  { mes: 'Mar', facturado: 2780000, cobrado: 2450000 },
  { mes: 'Abr', facturado: 2840500, cobrado: 2100000 },
]

const topClientes = [
  { nombre: 'ACME S.A.',            monto: 680000, pct: 100 },
  { nombre: 'Tech Solutions SRL',   monto: 520000, pct: 76  },
  { nombre: 'Distribuidora Norte',  monto: 390000, pct: 57  },
  { nombre: 'Inversiones Del Sur',  monto: 280000, pct: 41  },
  { nombre: 'Grupo Fernández',      monto: 195000, pct: 29  },
]

const aging = [
  { rango: '0 – 30 días',  monto: 320000, color: 'bg-emerald-500', pct: 43 },
  { rango: '31 – 60 días', monto: 210000, color: 'bg-yellow-400',  pct: 28 },
  { rango: '61 – 90 días', monto: 150000, color: 'bg-orange-500',  pct: 20 },
  { rango: '+90 días',     monto: 60500,  color: 'bg-red-500',     pct: 8  },
]

const ultimosComprobantes = [
  { numero: 'FA-0001-00001234', cliente: 'ACME S.A.',           monto: 180000, estado: 'EMITIDO',  fecha: '28/04/2026' },
  { numero: 'FA-0001-00001233', cliente: 'Tech Solutions SRL',  monto: 95000,  estado: 'EMITIDO',  fecha: '27/04/2026' },
  { numero: 'FB-0001-00000891', cliente: 'Juan Pérez',          monto: 45000,  estado: 'EMITIDO',  fecha: '26/04/2026' },
  { numero: 'FA-0001-00001232', cliente: 'Dist. Norte',         monto: 230000, estado: 'BORRADOR', fecha: '25/04/2026' },
  { numero: 'NC-0001-00000045', cliente: 'Inversiones Del Sur', monto: -28000, estado: 'EMITIDO',  fecha: '24/04/2026' },
]

const estadoBadge: Record<string, string> = {
  EMITIDO:  'bg-emerald-100 text-emerald-700',
  BORRADOR: 'bg-gray-100 text-gray-600',
  PENDIENTE:'bg-yellow-100 text-yellow-700',
  ERROR:    'bg-red-100 text-red-700',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 mb-1" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name === 'facturado' ? 'Facturado' : 'Cobrado'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const ivaDebito  = 248600
  const ivaCredito = 124300
  const ivaSaldo   = ivaDebito - ivaCredito

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-400">Abril 2026</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Facturado este mes" value={fmt(2840500)} sub="+12% vs marzo" trend="up"
          icon={TrendingUp} iconBg="bg-brand-50" iconColor="text-brand-600" />
        <StatCard label="IVA a pagar" value={fmt(ivaSaldo)} sub="Vence 12/05/2026" trend="down"
          icon={AlertCircle} iconBg="bg-red-50" iconColor="text-red-600" valueColor="text-red-600" />
        <StatCard label="Cobrado efectivo" value={fmt(2100000)} sub="74% del facturado" trend="neutral"
          icon={FileText} iconBg="bg-emerald-50" iconColor="text-emerald-600" valueColor="text-emerald-700" />
        <StatCard label="Pendiente de cobro" value={fmt(740500)} sub="26% del facturado" trend="neutral"
          icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600" valueColor="text-yellow-700" />
      </div>

      {/* Chart + Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Facturado vs Cobrado — 12 meses</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-brand-500 inline-block" /> Facturado</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-emerald-500 inline-block" /> Cobrado</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="facturado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Aging de Cobranza</h2>
          <p className="text-xs text-gray-400 mb-4">Total pendiente: {fmt(740500)}</p>
          <div className="space-y-4">
            {aging.map((a) => (
              <div key={a.rango}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">{a.rango}</span>
                  <span className="font-semibold text-gray-900">{fmt(a.monto)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${a.color} rounded-full transition-all`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top clientes + IVA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Top 5 Clientes</h2>
          <div className="space-y-3">
            {topClientes.map((c, i) => (
              <div key={c.nombre} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{c.nombre}</span>
                    <span className="text-gray-700 font-semibold">{fmt(c.monto)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Posición IVA — Abril 2026</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <div>
                <p className="text-sm text-gray-600">IVA Débito Fiscal</p>
                <p className="text-xs text-gray-400">Por ventas realizadas</p>
              </div>
              <span className="text-lg font-bold text-gray-900">{fmt(ivaDebito)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <div>
                <p className="text-sm text-gray-600">IVA Crédito Fiscal</p>
                <p className="text-xs text-gray-400">Por compras a proveedores</p>
              </div>
              <span className="text-lg font-bold text-emerald-600">− {fmt(ivaCredito)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-red-50 rounded-xl px-4 mt-2">
              <div>
                <p className="text-sm font-semibold text-red-700">Saldo a pagar</p>
                <p className="text-xs text-red-400">Vence 12/05/2026</p>
              </div>
              <span className="text-xl font-bold text-red-700">{fmt(ivaSaldo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos comprobantes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Últimos comprobantes</h2>
          <a href="/app/comprobantes" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="text-left px-6 py-3 font-medium">Número</th>
                <th className="text-left px-6 py-3 font-medium">Cliente</th>
                <th className="text-right px-6 py-3 font-medium">Monto</th>
                <th className="text-center px-6 py-3 font-medium">Estado</th>
                <th className="text-right px-6 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ultimosComprobantes.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{c.numero}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{c.cliente}</td>
                  <td className={`px-6 py-3 text-right font-semibold ${c.monto < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {fmt(c.monto)}{c.monto < 0 ? ' (NC)' : ''}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge[c.estado]}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500">{c.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, trend, icon: Icon, iconBg, iconColor, valueColor = 'text-gray-900' }: {
  label: string; value: string; sub: string; trend: 'up' | 'down' | 'neutral'
  icon: any; iconBg: string; iconColor: string; valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor} mb-1`}>{value}</p>
      <div className="flex items-center gap-1 text-xs">
        {trend === 'up'   && <TrendingUp   size={12} className="text-emerald-500" />}
        {trend === 'down' && <TrendingDown  size={12} className="text-red-500" />}
        <span className={trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}>
          {sub}
        </span>
      </div>
    </div>
  )
}
