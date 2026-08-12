import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Dashboard() {
  const [resumes, setResumes] = useState([])
  const [jds, setJds] = useState([])
  const [sessions, setSessions] = useState([])

  const [resumeId, setResumeId] = useState('')
  const [jdId, setJdId] = useState('')
  const [jdTitle, setJdTitle] = useState('')
  const [jdText, setJdText] = useState('')

  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const refresh = async () => {
    const [r, j, s] = await Promise.all([
      client.get('/resumes'),
      client.get('/jds'),
      client.get('/sessions'),
    ])
    setResumes(r.data)
    setJds(j.data)
    setSessions(s.data)
    if (r.data[0]) setResumeId(r.data[0].id)
    if (j.data[0]) setJdId(j.data[0].id)
  }

  useEffect(() => { refresh() }, [])

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await client.post('/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResumes((prev) => [res.data, ...prev])
      setResumeId(res.data.id)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleJdSave = async (e) => {
    e.preventDefault()
    if (!jdText.trim()) return
    const res = await client.post('/jds', { title: jdTitle, raw_text: jdText })
    setJds((prev) => [res.data, ...prev])
    setJdId(res.data.id)
    setJdTitle('')
    setJdText('')
  }

  const handleGenerate = async () => {
    if (!resumeId || !jdId) {
      setError('Upload a resume and add a job description first')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const res = await client.post('/sessions/generate', {
        resume_id: Number(resumeId),
        jd_id: Number(jdId),
        num_questions: 8,
      })
      navigate(`/sessions/${res.data.id}`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="border border-line rounded-2xl p-6 bg-white">
          <h2 className="font-medium mb-1">1. Resume</h2>
          <p className="text-sm text-ink/60 mb-4">Upload a PDF. We'll parse and chunk it for retrieval.</p>
          <label className="block border-2 border-dashed border-line rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors">
            <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
            <span className="text-sm text-ink/60">
              {uploading ? 'Uploading…' : 'Click to choose a PDF'}
            </span>
          </label>
          {resumes.length > 0 && (
            <select
              value={resumeId} onChange={(e) => setResumeId(e.target.value)}
              className="mt-4 w-full border border-line rounded-lg px-3 py-2 text-sm"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
          )}
        </div>

        <div className="border border-line rounded-2xl p-6 bg-white">
          <h2 className="font-medium mb-1">2. Job description</h2>
          <p className="text-sm text-ink/60 mb-4">Paste the JD text you're prepping for.</p>
          <form onSubmit={handleJdSave} className="space-y-2">
            <input
              placeholder="Title (e.g. Backend Engineer @ Acme)" value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Paste job description here…" value={jdText} required
              onChange={(e) => setJdText(e.target.value)} rows={4}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" className="text-sm border border-line px-4 py-1.5 rounded-full hover:border-ink transition-colors">
              Save JD
            </button>
          </form>
          {jds.length > 0 && (
            <select
              value={jdId} onChange={(e) => setJdId(e.target.value)}
              className="mt-4 w-full border border-line rounded-lg px-3 py-2 text-sm"
            >
              {jds.map((j) => (
                <option key={j.id} value={j.id}>{j.title || `JD #${j.id}`}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleGenerate} disabled={generating}
        className="bg-ink text-paper px-6 py-3 rounded-full hover:bg-accent transition-colors disabled:opacity-50"
      >
        {generating ? 'Retrieving & generating…' : 'Generate interview questions'}
      </button>

      {sessions.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl mb-4">Past sessions</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <button
                key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}
                className="w-full text-left border border-line rounded-xl px-4 py-3 bg-white hover:border-accent transition-colors flex justify-between items-center"
              >
                <span className="text-sm">Session #{s.id} — {s.questions.length} questions</span>
                <span className="text-xs font-mono text-ink/40">{new Date(s.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
