import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { meQueryKey, ProtectedRoute } from './pages/ProtectedRoute'
import { RegisterPage } from './pages/RegisterPage'
import { RoomsListPage } from './pages/RoomsListPage'

function HomePage() {
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      queryClient.removeQueries({ queryKey: meQueryKey })
      navigate('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div>
      <p>Home page</p>
      <Link to="/rooms">Переговорні</Link>
      <button onClick={handleLogout} disabled={loggingOut}>
        Вийти
      </button>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <RoomsListPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}

export default App
