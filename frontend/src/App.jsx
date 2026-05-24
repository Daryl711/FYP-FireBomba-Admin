import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Login from './pages/Login'
import Layout from './pages/Layout'
import Users from './pages/Users'
import Rooms from './pages/Rooms'
import Sensors from './pages/Sensors'
import Alerts from './pages/Alerts'
import Waterpump from './pages/Waterpump'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { user } = useApp()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useApp()
  return user ? <Navigate to="/users" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="users" element={<Users />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="waterpump" element={<Waterpump />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
