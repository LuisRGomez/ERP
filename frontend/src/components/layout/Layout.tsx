import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

export default function Layout() {
  const { empresaId, token, setEmpresaId } = useAuthStore()

  useEffect(() => {
    if (token && !empresaId) {
      api.get('/empresas/?skip=0&limit=1')
        .then(res => { if (res.data?.length > 0) setEmpresaId(res.data[0].id) })
        .catch(() => {})
    }
  }, [token, empresaId, setEmpresaId])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
