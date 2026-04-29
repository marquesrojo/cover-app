import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import AppShell from '@/components/layout/AppShell'
import AuthScreen from '@/modules/auth/AuthScreen'
import DashboardScreen from '@/modules/dashboard/DashboardScreen'
import GemelScreen from '@/modules/gemelo/GemelScreen'
import InspeccionScreen, { InspectionDetail } from '@/modules/inspeccion/InspeccionScreen'
import TicketsScreen from '@/modules/tickets/TicketsScreen'
import { Spinner } from '@/components/ui'
import InspeccionScreen, { InspectionDetail, InspeccionList } from '@/modules/inspeccion/InspeccionScreen'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/auth" replace />
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
      <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"           element={<DashboardScreen />} />
        <Route path="gemelo"              element={<GemelScreen />} />
        <Route path="gemelo/:plantId"     element={<GemelScreen />} />
       <Route path="inspeccion"          element={<InspeccionList />} />
       <Route path="inspeccion/nueva"    element={<InspeccionScreen />} />
       <Route path="inspeccion/:id"      element={<InspectionDetail />} />
        <Route path="tickets"             element={<TicketsScreen />} />
        <Route path="*"                   element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
