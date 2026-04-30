import { Link } from 'react-router-dom'
import { CheckCircle, Zap, Shield, BarChart2 } from 'lucide-react'

const features = [
  { icon: Zap,       title: 'Automatización total',   desc: 'Emitís facturas automáticamente desde tus ventas, sin intervención manual.' },
  { icon: Shield,    title: 'Siempre actualizado',     desc: 'Nos encargamos de los cambios de ARCA para que nunca tengas problemas.' },
  { icon: BarChart2, title: 'Analytics en tiempo real',desc: 'Dashboard con métricas de facturación, clientes y períodos.' },
  { icon: CheckCircle, title: 'Multi-empresa',         desc: 'Gestioná múltiples CUITs desde una sola cuenta. Ideal para contadores.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold text-brand-600">FacturaSaaS</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Iniciar sesión</Link>
          <Link to="/register" className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
            Probá gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 py-24">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Facturá automáticamente<br />y sin errores
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Vos ocupate de vender. La facturación electrónica con ARCA, dejala en nuestras manos.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition-colors">
            Empezar gratis — 15 días
          </Link>
          <Link to="/login" className="text-gray-600 hover:text-gray-900 px-8 py-3 rounded-lg border border-gray-200 text-lg">
            Ver demo
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Sin tarjeta de crédito. Sin configuraciones eternas.</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Empezar es simple</h2>
        <p className="text-gray-500 mb-8">Creás tu cuenta, conectás tu CUIT con ARCA y en minutos estás facturando.</p>
        <Link to="/register" className="bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition-colors">
          Crear cuenta gratis
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2026 FacturaSaaS · Todos los derechos reservados
      </footer>
    </div>
  )
}
