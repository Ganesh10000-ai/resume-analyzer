import { useEffect, useState, useRef } from 'react'
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

function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    client.get(`/sessions/${sessionId}/chat`).then((res) => setMessages(res.data))
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    // optimistically show the user's message
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() }])
    try {
      const res = await client.post(`/sessions/${sessionId}/chat`, { message: text })
      setMessages((prev) => [...prev, res.data])
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="border border-line rounded-2xl bg-white flex flex-col h-[520px]">
      <div className="px-5 py-3 border-b border-line">
        <h2 className="font-display text-lg">Ask about this session</h2>
        <p className="text-xs text-ink/50">Remembers this conversation · grounded in your resume + JD</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-ink/40">
            Try: "what else could they ask about my most recent project?" or
            "how should I explain a resume gap here?"
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user' ? 'bg-ink text-paper' : 'bg-paper border border-line'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-paper border border-line rounded-2xl px-4 py-2 text-sm text-ink/40">…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-line flex gap-2">
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
          rows={1} placeholder="Ask a follow-up question…"
          className="flex-1 border border-line rounded-full px-4 py-2 text-sm resize-none outline-none focus:border-accent"
        />
        <button
          onClick={send} disabled={sending}
          className="bg-ink text-paper px-4 py-2 rounded-full text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
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
    <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-[1.3fr_1fr] gap-8 items-start">
      <div>
        <h1 className="font-display text-3xl mb-1">Session #{session.id}</h1>
        <p className="text-ink/60 mb-8">{session.questions.length} questions, grounded in your resume.</p>
        <div className="space-y-6">
          {session.questions.map((q) => <QuestionCard key={q.id} q={q} />)}
        </div>
      </div>
      <div className="md:sticky md:top-24">
        <ChatPanel sessionId={session.id} />
      </div>
    </div>
  )
}