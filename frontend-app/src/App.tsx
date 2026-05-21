import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import Incidents from './pages/Incidents'
import Analytics from './pages/Analytics'
import Hotspots from './pages/Hotspots'
import Users from './pages/Users'
import Profile from './pages/Profile'
import AuditLog from './pages/AuditLog'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="map"        element={<MapPage />} />
          <Route path="incidents"  element={<Incidents />} />
          <Route path="hotspots"   element={<Hotspots />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="users"      element={<Users />} />
          <Route path="profile"    element={<Profile />} />
          <Route path="audit-log"  element={<AuditLog />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
