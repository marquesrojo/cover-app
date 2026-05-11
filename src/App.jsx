import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import AppShell from '@/components/layout/AppShell'
import AuthScreen from '@/modules/auth/AuthScreen'
import DashboardScreen from '@/modules/dashboard/DashboardScreen'
import GemelScreen from '@/modules/gemelo/GemelScreen'
import InspeccionScreen, { InspectionDetail, InspeccionList } from '@/modules/inspeccion/InspeccionScreen'
import ObrasScreen from '@/modules/obras/ObrasScreen'
import LegajoObra from '@/modules/obras/LegajoObra'
import ParteDetalle from '@/modules/obras/ParteDetalle'
import CalendarioScreen from '@/modules/calendario/CalendarioScreen'
import AdminScreen from '@/modules/admin/AdminScreen'
import { Spinner } from '@/components/ui'

// Pantalla de espera de aprobación
function PendingApprovalScreen({ onSignOut }) {
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, fontWeight: 700, color: '#f5a623', letterSpacing: '-0.04em', marginBottom: 6 }}>COVER</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#64748b', letterSpacing: '0.15em', marginBottom: 40 }}>GRUPO AISLAR</div>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Cuenta pendiente de aprobación</div>
        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
          Tu cuenta fue creada correctamente. El administrador de Cover la revisará y te habilitará el acceso a la brevedad.
        </div>
        <div style={{ background: '#0d1117', border: '1px solid #1e2533', borderRadius: 8, padding: 14, marginBottom: 24 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Próximos pasos</div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
            Una vez aprobado, recibirás acceso completo a la plataforma y serás asignado a tu empresa.
          </div>
        </div>
        <button onClick={onSignOut} style={{ background: 'none', border: '1px solid #1e2533', borderRadius: 8, padding: '10px 20px', color: '#64748b', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer' }}>
          CERRAR SESIÓN
        </button>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading, profile, signOut } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/auth" replace />
  if (profile && !profile.approved && profile.role !== 'cover_admin' && profile.role !== 'admin') {
    return <PendingApprovalScreen onSignOut={signOut} />
  }
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07090f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 700, color: '#f5a623', letterSpacing: '-0.04em' }}>COVER</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthScreen />} />
      <Route path="/obras/parte/:id" element={<ParteDetalle />} />
      <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"        element={<DashboardScreen />} />
        <Route path="gemelo"           element={<GemelScreen />} />
        <Route path="gemelo/:plantId"  element={<GemelScreen />} />
        <Route path="inspeccion/lista" element={<InspeccionList />} />
        <Route path="inspeccion/nueva" element={<InspeccionScreen />} />
        <Route path="inspeccion/:id"   element={<InspectionDetail />} />
        <Route path="obras"            element={<ObrasScreen />} />
        <Route path="obras/legajo/:id" element={<LegajoObra />} />
        <Route path="calendario"       element={<CalendarioScreen />} />
        <Route path="admin"            element={<AdminScreen />} />
        <Route path="*"                element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
