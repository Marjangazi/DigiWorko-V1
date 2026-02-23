import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import CompleteProfile from './pages/CompleteProfile'
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import Wallet from './pages/Wallet'
import Referral from './pages/Referral'
import Tournaments from './pages/Tournaments'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/complete-profile" element={
            <ProtectedRoute allowIncomplete={true}><CompleteProfile /></ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          
          <Route path="/shop" element={
            <ProtectedRoute><Shop /></ProtectedRoute>
          } />
          
          <Route path="/wallet" element={
            <ProtectedRoute><Wallet /></ProtectedRoute>
          } />
          
          <Route path="/referral" element={
            <ProtectedRoute><Referral /></ProtectedRoute>
          } />
          
          <Route path="/tournaments" element={
            <ProtectedRoute><Tournaments /></ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute><Admin /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
