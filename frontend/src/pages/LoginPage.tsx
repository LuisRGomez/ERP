import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

interface LoginForm { email: string; password: string }

export default function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()
  const { setTokens, setEmpresaId } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const afterLogin = async () => {
    try {
      const res = await api.get('/empresas/?skip=0&limit=1')
      const empresas = res.data
      if (empresas?.length > 0) {
        setEmpresaId(empresas[0].id)
        navigate('/app/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch {
      navigate('/app/dashboard')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const res = await api.post('/auth/login', data)
      setTokens(res.data.access_token, res.data.refresh_token)
      await afterLogin()
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Credenciales incorrectas')
    }
  }

  const enterDemo = async () => {
    setTokens('demo-token', 'demo-token')
    try {
      const res = await api.get('/empresas/?skip=0&limit=1')
      if (res.data?.length > 0) setEmpresaId(res.data[0].id)
    } catch {}
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Iniciar sesión</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresá a tu cuenta ERP</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              {...register('password', { required: true })}
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 text-sm"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">o</span></div>
        </div>
        <button onClick={enterDemo} className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
          Probar demo sin registro
        </button>
        <p className="text-sm text-center text-gray-400 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">Registrate gratis</Link>
        </p>
      </div>
    </div>
  )
}
