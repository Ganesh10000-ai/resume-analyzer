import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './api/auth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SessionView from './pages/SessionView'

function Protected({ user, loading, children }) {
  if (loading) return <div className="max-w-5xl mx-auto px-6 py-12 text-ink/60">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const auth = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={auth.user} onLogout={auth.logout} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home user={auth.user} />} />
          <Route path="/login" element={<Login auth={auth} />} />
          <Route path="/register" element={<Register auth={auth} />} />
          <Route
            path="/dashboard"
            element={<Protected user={auth.user} loading={auth.loading}><Dashboard /></Protected>}
          />
          <Route
            path="/sessions/:id"
            element={<Protected user={auth.user} loading={auth.loading}><SessionView /></Protected>}
          />
        </Routes>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs font-mono text-ink/40">
        built with fastapi · chromadb · groq · mysql
      </footer>
    </div>
  )
}
