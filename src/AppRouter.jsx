import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CampSelection from './pages/CampSelection'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLogin from './pages/AdminLogin'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'

function PrivateRoute({ children, requireAdmin }) {
  const role = localStorage.getItem('role')
  const user = localStorage.getItem('user')
  if (requireAdmin) {
    return role === 'admin'
      ? children
      : <Navigate to="/" replace state={{ message: 'Session expired or unauthorized' }} />
  }
  return role === 'member' && user
    ? children
    : <Navigate to="/" replace state={{ message: 'Session expired or unauthorized' }} />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 5000 }}
        containerStyle={{ top: 16, right: 16 }}
      />
      <Routes>
        <Route path="/"               element={<CampSelection />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/admin-login"    element={<AdminLogin />} />
        <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin-dashboard" element={<PrivateRoute requireAdmin><AdminDashboard /></PrivateRoute>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
