import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Register({ auth }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await auth.register(email, password, fullName)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-3xl mb-1">Create your account</h1>
      <p className="text-ink/60 mb-8">Upload a resume once, prep for every JD after.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink/50">Full name</label>
          <input
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full border border-line rounded-lg px-3 py-2.5 focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink/50">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-line rounded-lg px-3 py-2.5 focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink/50">Password</label>
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-line rounded-lg px-3 py-2.5 focus:border-accent outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy} type="submit"
          className="w-full bg-ink text-paper rounded-full py-2.5 hover:bg-accent transition-colors disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        Already have one? <Link to="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </div>
  )
}
