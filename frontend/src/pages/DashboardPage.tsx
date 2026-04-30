import { TrendingUp, TrendingDown, FileText, Clock, AlertCircle, ArrowUpRight, Activity } from 'lucide-react'
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
  { rango: '31 – 60 días', monto: 210000, color: 'bg-amber-400',   pct: 28 },
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
  EMITIDO:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  BORRADOR: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/60',
  PENDIENTE:'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  ERROR:    'bg-red-50 text-red-700 ring-1 ring-red-200/60',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-dropdown p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 mb-1 text-xs" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name === 'facturado' ? 'Facturado' : 'Cobrado'}: <strong>{fmt(p.value)}</strong>
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
    <div className="space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Resumen ejecutivo · Abril 2026</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3.5 py-2 text-sm text-gray-500 shadow-card">
          <Activity size={14} className="text-emerald-500" />
          <span className="font-medium text-gray-700">En vivo</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Facturado este mes"
          value={fmt(2840500)}
          sub="+12% vs marzo"
          trend="up"
          accent="blue"
          icon={TrendingUp}
        />
        <StatCard
          label="IVA a pagar"
          value={fmt(ivaSaldo)}
          sub="Vence 12/05/2026"
          trend="down"
          accent="red"
          icon={AlertCircle}
        />
        <StatCard
          label="Cobrado efectivo"
          value={fmt(2100000)}
          sub="74% del facturado"
          trend="up"
          accent="green"
          icon={FileText}
        />
        <StatCard
          label="Pendiente de cobro"
          value={fmt(740500)}
          sub="26% del facturado"
          trend="neutral"
          accent="amber"
          icon={Clock}
        />
      </div>

      {/* Chart + Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Facturado vs Cobrado</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 12 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block" />
                Facturado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Cobrado
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="facturado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cobrado"   fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <div className="mb-5">
            <h2 className="section-title">Aging de Cobranza</h2>
            <p className="text-xs text-gray-400 mt-0.5">Total pendiente: <span className="font-semibold text-gray-600">{fmt(740500)}</span></p>
          </div>
          <div className="space-y-5">
            {aging.map((a) => (
              <div key={a.rango}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">{a.rango}</span>
                  <span className="text-sm font-semibold text-gray-900">{fmt(a.monto)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${a.color} rounded-full transition-all`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top clientes + IVA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <h2 className="section-title mb-5">Top 5 Clientes</h2>
          <div className="space-y-4">
            {topClientes.map((c, i) => (
              <div key={c.nombre} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4 shrink-0 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{c.nombre}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-3 shrink-0">{fmt(c.monto)}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <h2 className="section-title mb-5">Posición IVA — Abril 2026</h2>
          <div className="space-y-1">
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">IVA Débito Fiscal</p>
                <p className="text-xs text-gray-400 mt-0.5">Por ventas realizadas</p>
              </div>
              <span className="text-base font-bold text-gray-900">{fmt(ivaDebito)}</span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">IVA Crédito Fiscal</p>
                <p className="text-xs text-gray-400 mt-0.5">Por compras a proveedores</p>
              </div>
              <span className="text-base font-bold text-emerald-600">− {fmt(ivaCredito)}</span>
            </div>
            <div className="flex justify-between items-center mt-3 bg-red-50 rounded-xl px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-red-700">Saldo a pagar</p>
                <p className="text-xs text-red-400 mt-0.5">Vence 12/05/2026</p>
              </div>
              <span className="text-xl font-bold text-red-700">{fmt(ivaSaldo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos comprobantes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="section-title">Últimos comprobantes</h2>
          </div>
          <a href="/app/comprobantes" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
            Ver todos <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Número</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ultimosComprobantes.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-400">{c.numero}</td>
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-800">{c.cliente}</td>
                  <td className={`px-6 py-3.5 text-right text-sm font-semibold ${c.monto < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {fmt(c.monto)}{c.monto < 0 ? ' (NC)' : ''}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`badge ${estadoBadge[c.estado]}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-xs text-gray-400 tabular-nums">{c.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

const accentMap = {
  blue:  { bg: 'bg-brand-50',   icon: 'text-brand-600',   border: 'border-brand-200',  value: 'text-gray-900' },
  red:   { bg: 'bg-red-50',     icon: 'text-red-500',     border: 'border-red-200',    value: 'text-red-600'  },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200',value: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50',   icon: 'text-amber-500',   border: 'border-amber-200',  value: 'text-amber-700' },
}

function StatCard({ label, value, sub, trend, accent, icon: Icon }: {
  label: string; value: string; sub: string; trend: 'up' | 'down' | 'neutral'
  accent: keyof typeof accentMap; icon: any
}) {
  const a = accentMap[accent]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 ${a.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={17} className={a.icon} />
        </div>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${a.value} mb-1.5`}>{value}</p>
      <div className="flex items-center gap-1.5 text-xs">
        {trend === 'up'   && <TrendingUp   size={11} className="text-emerald-500" />}
        {trend === 'down' && <TrendingDown  size={11} className="text-red-500" />}
        <span className={
          trend === 'up' ? 'text-emerald-600' :
          trend === 'down' ? 'text-red-500' : 'text-gray-400'
        }>
          {sub}
        </span>
      </div>
    </div>
  )
}
