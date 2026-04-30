import { useState } from 'react'
import { Plus, Search, Users, UserCheck, Banknote, RefreshCw } from 'lucide-react'
import { useQuery } from '@/hooks/useErp'
import { rrhhApi, type Empleado } from '@/services/erp'

const MODALIDAD_BADGE: Record<string, string> = {
  DEPENDENCIA:  'bg-blue-100 text-blue-700',
  MONOTRIBUTO:  'bg-emerald-100 text-emerald-700',
  AUTONOMO:     'bg-purple-100 text-purple-700',
  PASANTE:      'bg-amber-100 text-amber-700',
}

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function RRHHPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroDepto, setFiltroDepto] = useState('')

  const { data, loading, error, refetch } = useQuery((eid) => rrhhApi.listarEmpleados(eid, true))
  const resumen = useQuery((eid) =>
    fetch(`/api/v1/rrhh/resumen?empresa_id=${eid}`).then(r => r.json())
  )

  const empleados = (data ?? []).filter((e: Empleado) => {
    const nombre = `${e.apellido} ${e.nombre}`.toLowerCase()
    return (
      nombre.includes(busqueda.toLowerCase()) &&
      (filtroDepto === '' || e.departamento === filtroDepto)
    )
  })

  const deptos = [...new Set((data ?? []).map((e: Empleado) => e.departamento).filter(Boolean))]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RRHH</h1>
          <p className="text-sm text-slate-500 mt-0.5">Legajos y nómina de empleados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg">
            <RefreshCw size={15} />
          </button>
          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />Nuevo empleado
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-blue-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Empleados activos</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{loading ? '…' : empleados.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={18} className="text-emerald-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Masa salarial bruta</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {loading ? '…' : fmtARS((data ?? []).reduce((s: number, e: Empleado) => s + e.salario_bruto, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={18} className="text-purple-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Departamentos</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{deptos.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por apellido o nombre..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={filtroDepto} onChange={e => setFiltroDepto(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
          <option value="">Todos los departamentos</option>
          {deptos.map(d => <option key={d} value={d!}>{d}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading
          ? <div className="py-16 text-center text-slate-400 text-sm">Cargando empleados…</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Apellido y nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">CUIL</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Puesto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Departamento</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Modalidad</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Ingreso</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Salario bruto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empleados.map((e: Empleado) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{e.apellido}, {e.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.cuil ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{e.puesto ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{e.departamento ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MODALIDAD_BADGE[e.modalidad] ?? 'bg-slate-100 text-slate-600'}`}>
                        {e.modalidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{e.fecha_ingreso ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtARS(e.salario_bruto)}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-brand-600 hover:underline font-medium">Ver legajo</button>
                    </td>
                  </tr>
                ))}
                {empleados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      No hay empleados registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
