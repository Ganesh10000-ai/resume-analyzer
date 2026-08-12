import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import client from '../api/client'

function QuestionCard({ q }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!draft.trim()) return
    setSubmitting(true)
    try {
      const res = await client.post(`/questions/${q.id}/answer`, { answer_text: draft })
      setFeedback(res.data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-line rounded-2xl p-6 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wide bg-accent2/20 px-2 py-1 rounded">
          {q.category}
        </span>
      </div>
      <p className="font-display text-xl mb-4">{q.question_text}</p>

      {q.source_snippet && (
        <details className="mb-4 text-sm">
          <summary className="cursor-pointer text-accent font-mono text-xs">grounded in your resume ↓</summary>
          <p className="mt-2 border-l-2 border-accent2 pl-3 italic text-ink/60">{q.source_snippet}</p>
        </details>
      )}

      <div className="flex gap-3 text-sm mb-3">
        <button onClick={() => setShowAnswer((v) => !v)} className="text-accent hover:underline">
          {showAnswer ? 'Hide model answer' : 'Show model answer'}
        </button>
        <button onClick={() => setPracticeMode((v) => !v)} className="text-accent hover:underline">
          {practiceMode ? 'Cancel practice' : 'Practice this answer'}
        </button>
      </div>

      {showAnswer && (
        <p className="text-sm bg-paper border border-line rounded-lg p-3 mb-3 whitespace-pre-line">
          {q.model_answer}
        </p>
      )}

      {practiceMode && (
        <div className="space-y-2">
          <textarea
            value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
            placeholder="Type your answer…"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={submit} disabled={submitting}
            className="text-sm bg-ink text-paper px-4 py-1.5 rounded-full hover:bg-accent transition-colors disabled:opacity-50"
          >
            {submitting ? 'Scoring…' : 'Get feedback'}
          </button>
          {feedback && (
            <div className="text-sm border border-line rounded-lg p-3 mt-2">
              <p className="font-mono text-xs text-accent mb-1">score: {feedback.score}/10</p>
              <p className="text-ink/70">{feedback.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionView() {
  const { id } = useParams()
  const [session, setSession] = useState(null)

  useEffect(() => {
    client.get(`/sessions/${id}`).then((res) => setSession(res.data))
  }, [id])

  if (!session) return <div className="max-w-3xl mx-auto px-6 py-12 text-ink/60">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-1">Session #{session.id}</h1>
      <p className="text-ink/60 mb-8">{session.questions.length} questions, grounded in your resume.</p>
      <div className="space-y-6">
        {session.questions.map((q) => <QuestionCard key={q.id} q={q} />)}
      </div>
    </div>
  )
}
