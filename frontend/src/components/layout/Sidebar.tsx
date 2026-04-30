import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FileInput, Users,
  BarChart3, Calendar, PieChart, Settings, Receipt, LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '@/stores/authStore'

const navGroups = [
  {
    label: 'GESTIÓN',
    links: [
      { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/comprobantes', icon: FileText,         label: 'Emitidos' },
      { to: '/app/recibidos',    icon: FileInput,        label: 'Recibidos' },
      { to: '/app/clientes',     icon: Users,            label: 'Clientes' },
    ],
  },
  {
    label: 'ANÁLISIS',
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-slate-900 flex flex-col h-full">
      <div className="h-16 flex items-center px-5 border-b border-slate-800">
        <Receipt size={22} className="text-brand-400 mr-2.5 shrink-0" />
        <span className="text-white font-bold text-lg tracking-tight">FacturaSaaS</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800',
                    )
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
        <NavLink
          to="/app/configuracion"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800',
            )
          }
        >
          <Settings size={16} />
          Configuración
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
