import { useState } from 'react'
import { Plus, Landmark, TrendingUp, TrendingDown, ArrowLeftRight, DollarSign } from 'lucide-react'

type Cuenta = {
  id: string
  nombre: string
  tipo: 'BANCO' | 'CAJA' | 'VIRTUAL'
  banco?: string
  cbu?: string
  alias?: string
  moneda: string
  saldo: number
}

type Movimiento = {
  id: string
  fecha: string
  tipo: 'COBRO' | 'PAGO' | 'TRANSFERENCIA'
  concepto: string
  referencia?: string
  importe: number
  cuenta: string
}

const CUENTAS: Cuenta[] = [
  { id: '1', nombre: 'Banco Galicia Cta Cte', tipo: 'BANCO', banco: 'Galicia', cbu: '0070999030000001234567', alias: 'EMPRESA.GALICIA', moneda: 'ARS', saldo: 485230 },
  { id: '2', nombre: 'Caja chica oficina', tipo: 'CAJA', moneda: 'ARS', saldo: 15000 },
  { id: '3', nombre: 'MercadoPago', tipo: 'VIRTUAL', moneda: 'ARS', saldo: 32450 },
]

const MOVIMIENTOS: Movimiento[] = [
  { id: '1', fecha: '2025-04-28', tipo: 'COBRO', concepto: 'Pago Factura #00010042 - Cliente ABC', referencia: 'TRF-20250428', importe: 145200, cuenta: 'Banco Galicia Cta Cte' },
  { id: '2', fecha: '2025-04-25', tipo: 'PAGO', concepto: 'Pago Factura compra #1042 - Distribuidora Norte', referencia: 'TRF-20250425', importe: 145200, cuenta: 'Banco Galicia Cta Cte' },
  { id: '3', fecha: '2025-04-20', tipo: 'COBRO', concepto: 'Pago Factura #00010041 - Cliente XYZ', importe: 85000, cuenta: 'MercadoPago' },
  { id: '4', fecha: '2025-04-15', tipo: 'TRANSFERENCIA', concepto: 'Transferencia entre cuentas', importe: 20000, cuenta: 'Caja chica oficina' },
]

const fmtARS = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const TIPO_CONFIG = {
  COBRO:        { color: 'text-emerald-600', icon: TrendingUp,      bg: 'bg-emerald-50',  signo: '+' },
  PAGO:         { color: 'text-red-500',     icon: TrendingDown,    bg: 'bg-red-50',      signo: '-' },
  TRANSFERENCIA:{ color: 'text-blue-600',    icon: ArrowLeftRight,  bg: 'bg-blue-50',     signo: '' },
}

const TIPO_CUENTA_BADGE: Record<string, string> = {
  BANCO:   'bg-blue-100 text-blue-700',
  CAJA:    'bg-amber-100 text-amber-700',
  VIRTUAL: 'bg-purple-100 text-purple-700',
}

export default function TesoreriaPage() {
  const [tab, setTab] = useState<'cuentas' | 'cobros' | 'pagos' | 'movimientos'>('cuentas')

  const totalSaldo = CUENTAS.reduce((s, c) => s + c.saldo, 0)
  const totalCobros = MOVIMIENTOS.filter(m => m.tipo === 'COBRO').reduce((s, m) => s + m.importe, 0)
  const totalPagos = MOVIMIENTOS.filter(m => m.tipo === 'PAGO').reduce((s, m) => s + m.importe, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tesorería</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cuentas bancarias, cobros y pagos</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Registrar movimiento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={18} className="text-blue-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Posición total</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmtARS(totalSaldo)}</p>
          <p className="text-xs text-slate-400 mt-1">{CUENTAS.length} cuentas activas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Cobros del mes</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmtARS(totalCobros)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pagos del mes</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{fmtARS(totalPagos)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-5">
        {(['cuentas', 'cobros', 'pagos', 'movimientos'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'cuentas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CUENTAS.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{c.nombre}</p>
                  {c.banco && <p className="text-xs text-slate-400 mt-0.5">{c.banco}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_CUENTA_BADGE[c.tipo]}`}>
                  {c.tipo}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">{fmtARS(c.saldo)}</p>
              {c.alias && (
                <p className="text-xs font-mono text-slate-400">{c.alias}</p>
              )}
              {c.cbu && (
                <p className="text-xs font-mono text-slate-300 mt-0.5 truncate">{c.cbu}</p>
              )}
            </div>
          ))}
          <button className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
            <Plus size={20} />
            <span className="text-sm font-medium">Nueva cuenta</span>
          </button>
        </div>
      )}

      {(tab === 'cobros' || tab === 'pagos' || tab === 'movimientos') && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Concepto</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Referencia</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cuenta</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOVIMIENTOS
                .filter(m => tab === 'movimientos' || m.tipo === tab.toUpperCase())
                .map(m => {
                  const cfg = TIPO_CONFIG[m.tipo]
                  const Icon = cfg.icon
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{m.fecha}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <Icon size={11} />{m.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{m.concepto}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.referencia || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{m.cuenta}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${cfg.color}`}>
                        {cfg.signo}{fmtARS(m.importe)}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
