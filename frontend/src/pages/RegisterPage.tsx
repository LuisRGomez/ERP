import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

interface RegisterForm { nombre: string; email: string; password: string }

const DEMO_TOKEN = 'demo-token-factura-saas'

export default function RegisterPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<RegisterForm>()
  const setTokens = useAuthStore((s) => s.setTokens)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    try {
      const res = await api.post('/auth/register', data)
      setTokens(res.data.access_token, res.data.refresh_token)
      navigate('/onboarding')
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Error al conectar con el servidor'
      setError(msg)
    }
  }

  const enterDemo = () => {
    setTokens(DEMO_TOKEN, DEMO_TOKEN)
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta gratis</h1>
        <p className="text-sm text-gray-500 mb-8">15 días de prueba, sin tarjeta de crédito.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input {...register('nombre', { required: true })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email', { required: true })} type="email" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input {...register('password', { required: true, minLength: 8 })} type="password" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">o</span></div>
        </div>
        <button onClick={enterDemo} className="w-full border border-brand-300 text-brand-700 py-2.5 rounded-lg font-medium hover:bg-brand-50 transition-colors text-sm">
          Probar demo sin registro
        </button>
        <p className="text-sm text-center text-gray-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
