import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FileInput, Users,
  PieChart, Calendar, BarChart3, Settings, Package,
  Building2, UploadCloud,
} from 'lucide-react'

const tabs = [
  { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/app/comprobantes',  icon: FileText,         label: 'Emitidos'      },
  { to: '/app/recibidos',     icon: FileInput,        label: 'Recibidos'     },
  { to: '/app/empresas',      icon: Building2,        label: 'Mis Empresas'  },
  { to: '/app/clientes',      icon: Users,            label: 'Clientes'      },
  { to: '/app/productos',     icon: Package,          label: 'Productos'     },
  { to: '/app/importacion',   icon: UploadCloud,      label: 'Importar'      },
  { to: '/app/kpis',          icon: PieChart,         label: 'KPIs'          },
  { to: '/app/calendario',    icon: Calendar,         label: 'Calendario'    },
  { to: '/app/reportes',      icon: BarChart3,        label: 'Reportes'      },
  { to: '/app/configuracion', icon: Settings,         label: 'Configuración' },
]

export default function NavTabs() {
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
      <div className="px-5 flex items-center gap-1 overflow-x-auto scrollbar-none h-12">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-brand-600 text-white shadow-sm shrink-0 transition-all'
                : 'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 shrink-0 transition-all'
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
