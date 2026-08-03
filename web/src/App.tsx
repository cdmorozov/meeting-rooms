import { Route, Routes } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './pages/ProtectedRoute'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>Home page</div>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}

export default App
