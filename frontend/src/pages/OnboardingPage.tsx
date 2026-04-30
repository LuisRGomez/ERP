import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

const steps = ['Tu empresa', 'Configurar ARCA', 'Listo']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">
        {/* Steps */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? '' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200 mx-3" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Datos de tu empresa</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
              <input placeholder="20-12345678-9" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón social</label>
              <input className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición ante IVA</label>
              <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="RI">Responsable Inscripto</option>
                <option value="MONO">Monotributista</option>
                <option value="EX">Exento</option>
              </select>
            </div>
            <button onClick={() => setStep(1)} className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
              Continuar
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Conectar con ARCA</h2>
            <p className="text-sm text-gray-500">Para emitir facturas necesitás autorizar a FacturaSaaS en tu portal de ARCA. Seguí estos pasos:</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <ol className="space-y-3 text-sm text-gray-700">
                {[
                  'Entrá a afip.gob.ar con tu Clave Fiscal',
                  'Ir a Administrador de Relaciones → Nueva Relación',
                  'Buscar CUIT de FacturaSaaS: 30-XXXXXXXX-X',
                  'Seleccionar: ARCA → WebServices → Factura Electrónica',
                  'Crear un Punto de Venta tipo Web Service',
                ].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Punto de Venta</label>
              <input placeholder="1" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
              Verificar y continuar
            </button>
            <button onClick={() => setStep(2)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors">
              Configurar después →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">¡Listo para facturar!</h2>
            <p className="text-sm text-gray-500">Tu cuenta está configurada. Ya podés emitir comprobantes electrónicos y gestionar tu empresa.</p>
            <button onClick={() => navigate('/app/dashboard')} className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
              Ir al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
