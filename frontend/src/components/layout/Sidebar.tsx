import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FileInput, Users, Building2,
  BarChart3, Calendar, PieChart, Settings, Zap, LogOut,
  Package, ShoppingCart, Landmark, FileCheck, Truck,
  BookOpen, UserRound,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '@/stores/authStore'

const navGroups = [
  {
    label: 'Ventas',
    links: [
      { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/presupuestos',  icon: FileCheck,       label: 'Presupuestos' },
      { to: '/app/comprobantes',  icon: FileText,        label: 'Emitidos' },
      { to: '/app/clientes',      icon: Users,           label: 'Clientes' },
    ],
  },
  {
    label: 'Compras',
    links: [
      { to: '/app/compras',      icon: ShoppingCart, label: 'Facturas recibidas' },
      { to: '/app/proveedores',  icon: Building2,    label: 'Proveedores' },
    ],
  },
  {
    label: 'Operaciones',
    links: [
      { to: '/app/inventario', icon: Package, label: 'Inventario' },
      { to: '/app/remitos',    icon: Truck,   label: 'Remitos' },
    ],
  },
  {
    label: 'Finanzas',
    links: [
      { to: '/app/tesoreria',    icon: Landmark,  label: 'Tesorería' },
      { to: '/app/contabilidad', icon: BookOpen,  label: 'Contabilidad' },
      { to: '/app/recibidos',    icon: FileInput, label: 'Comprobantes' },
    ],
  },
  {
    label: 'Personas',
    links: [
      { to: '/app/rrhh', icon: UserRound, label: 'RRHH' },
    ],
  },
  {
    label: 'Análisis',
    links: [
      { to: '/app/kpis',       icon: PieChart,  label: 'KPIs' },
      { to: '/app/calendario', icon: Calendar,  label: 'Calendario' },
      { to: '/app/reportes',   icon: BarChart3, label: 'Reportes' },
    ],
  },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <aside className="w-[220px] shrink-0 bg-[#0f1117] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-900/40">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">ERP</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em] px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={clsx('shrink-0 transition-colors', isActive ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-300')} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/5 space-y-0.5 shrink-0">
        <NavLink
          to="/app/configuracion"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
              isActive ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5',
            )
          }
        >
          <Settings size={15} />
          Configuración
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
