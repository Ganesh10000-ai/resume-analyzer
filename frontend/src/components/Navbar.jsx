import { Link, useNavigate } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate()
  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight">
          Ground<span className="text-accent">.</span>
          <span className="font-mono text-xs align-super text-ink/50 ml-1">rag interview prep</span>
        </Link>
        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="font-mono text-ink/60">{user.email}</span>
            <button
              onClick={() => { onLogout(); navigate('/login') }}
              className="border border-line px-3 py-1.5 rounded-full hover:border-ink transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="hover:text-accent transition-colors">Log in</Link>
            <Link to="/register" className="bg-ink text-paper px-4 py-1.5 rounded-full hover:bg-accent transition-colors">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
