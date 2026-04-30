import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Receipt, ChevronDown, Bell, LogOut, Settings, User, Building2, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const EMPRESAS = [
  { id: '1', nombre: 'Mi Empresa S.A.',     cuit: '30-71234567-8', cond: 'RI' },
  { id: '2', nombre: 'Consultora Norte SRL', cuit: '30-65432100-1', cond: 'RI' },
  { id: '3', nombre: 'Unipersonal Gómez',    cuit: '20-28765432-1', cond: 'MONO' },
]

export default function AppHeader() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(EMPRESAS[0])
  const [empOpen, setEmpOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0 relative z-30"
      style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #4f46e5 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
          <Receipt size={18} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">FacturaSaaS</span>
      </div>

      {/* Empresa selector */}
      <div className="relative">
        <button
          onClick={() => { setEmpOpen(!empOpen); setUserOpen(false) }}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all"
        >
          <Building2 size={15} className="opacity-80" />
          <span>{empresa.nombre}</span>
          <ChevronDown size={14} className={`opacity-70 transition-transform ${empOpen ? 'rotate-180' : ''}`} />
        </button>

        {empOpen && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 py-1.5">Mis empresas</p>
            {EMPRESAS.map((e) => (
              <button
                key={e.id}
                onClick={() => { setEmpresa(e); setEmpOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <Building2 size={14} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{e.nombre}</p>
                  <p className="text-xs text-gray-400">{e.cuit} · {e.cond}</p>
                </div>
                {empresa.id === e.id && <Check size={14} className="text-brand-600 shrink-0" />}
              </button>
            ))}
            <div className="border-t border-gray-50 mt-2 pt-2 px-4">
              <button className="text-xs text-brand-600 font-medium hover:underline">+ Agregar empresa</button>
            </div>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <button className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full ring-2 ring-white/30" />
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setEmpOpen(false) }}
            className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-1.5 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold">
              ME
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-white text-xs font-semibold leading-none">Mi Empresa</p>
              <p className="text-white/60 text-[10px] leading-none mt-0.5">Admin</p>
            </div>
            <ChevronDown size={13} className={`text-white/60 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute top-full mt-2 right-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-50 mb-1">
                <p className="text-sm font-semibold text-gray-900">Mi Empresa S.A.</p>
                <p className="text-xs text-gray-400">admin@miempresa.com</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User size={14} className="text-gray-400" />
                Mi perfil
              </button>
              <Link
                to="/app/configuracion"
                onClick={() => setUserOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={14} className="text-gray-400" />
                Configuración
              </Link>
              <div className="border-t border-gray-50 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside overlay */}
      {(empOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setEmpOpen(false); setUserOpen(false) }}
        />
      )}
    </header>
  )
}
