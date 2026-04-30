import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ComprobantesPage from '@/pages/ComprobantesPage'
import NuevoComprobantePage from '@/pages/NuevoComprobantePage'
import ClientesPage from '@/pages/ClientesPage'
import ReportesPage from '@/pages/ReportesPage'
import OnboardingPage from '@/pages/OnboardingPage'
import LandingPage from '@/pages/LandingPage'
import KPIsPage from '@/pages/KPIsPage'
import CalendarioPage from '@/pages/CalendarioPage'
import RecibidosPage from '@/pages/RecibidosPage'
import ConfiguracionPage from '@/pages/ConfiguracionPage'
import ProductosPage from '@/pages/ProductosPage'
import MisEmpresasPage from '@/pages/MisEmpresasPage'
import ImportacionPage from '@/pages/ImportacionPage'
import ProveedoresPage from '@/pages/ProveedoresPage'
import InventarioPage from '@/pages/InventarioPage'
import ComprasPage from '@/pages/ComprasPage'
import TesoreriaPage from '@/pages/TesoreriaPage'
import PresupuestosPage from '@/pages/PresupuestosPage'
import ContabilidadPage from '@/pages/ContabilidadPage'
import RRHHPage from '@/pages/RRHHPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="presupuestos"  element={<PresupuestosPage />} />
        <Route path="comprobantes"  element={<ComprobantesPage />} />
        <Route path="comprobantes/nuevo" element={<NuevoComprobantePage />} />
        <Route path="recibidos"     element={<RecibidosPage />} />
        <Route path="clientes"      element={<ClientesPage />} />
        <Route path="productos"     element={<ProductosPage />} />
        <Route path="proveedores"   element={<ProveedoresPage />} />
        <Route path="compras"       element={<ComprasPage />} />
        <Route path="inventario"    element={<InventarioPage />} />
        <Route path="remitos"       element={<InventarioPage />} />
        <Route path="tesoreria"     element={<TesoreriaPage />} />
        <Route path="contabilidad"  element={<ContabilidadPage />} />
        <Route path="rrhh"          element={<RRHHPage />} />
        <Route path="kpis"          element={<KPIsPage />} />
        <Route path="calendario"    element={<CalendarioPage />} />
        <Route path="reportes"      element={<ReportesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="empresas"      element={<MisEmpresasPage />} />
        <Route path="importacion"   element={<ImportacionPage />} />
      </Route>
    </Routes>
  )
}
