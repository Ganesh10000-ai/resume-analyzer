import { Link } from 'react-router-dom'

export default function Home({ user }) {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <section className="py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            resume × job description → grounded questions
          </p>
          <h1 className="font-display text-5xl leading-[1.05] mb-6">
            Every question, traced back to a line on your resume.
          </h1>
          <p className="text-ink/70 text-lg mb-8 max-w-md">
            Upload your resume and a job description. We retrieve the exact
            bullet points that matter, and generate interview questions
            grounded in what you actually wrote — not generic prep.
          </p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-block bg-ink text-paper px-6 py-3 rounded-full hover:bg-accent transition-colors"
          >
            {user ? 'Go to dashboard' : 'Start prepping — free'}
          </Link>
        </div>
        <div className="border border-line rounded-2xl p-6 bg-white shadow-sm">
          <p className="font-mono text-xs text-ink/40 mb-3">retrieved from your resume</p>
          <p className="text-sm text-ink/70 mb-4 border-l-2 border-accent2 pl-3 italic">
            "Built a caching layer with Redis reducing API latency by 40% for
            a service handling 10k req/min."
          </p>
          <p className="font-mono text-xs text-ink/40 mb-2">generated question</p>
          <p className="font-display text-lg mb-4">
            "Walk me through how you identified the latency bottleneck before
            reaching for Redis."
          </p>
          <span className="inline-block text-xs font-mono bg-accent2/20 text-ink/70 px-2 py-1 rounded">
            category: project
          </span>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 pb-24 border-t border-line pt-16">
        <div>
          <p className="font-display text-2xl mb-2">01</p>
          <h3 className="font-medium mb-1">Upload resume + JD</h3>
          <p className="text-sm text-ink/60">PDF resume, pasted job description. Parsed and chunked into sections.</p>
        </div>
        <div>
          <p className="font-display text-2xl mb-2">02</p>
          <h3 className="font-medium mb-1">Retrieval, not guessing</h3>
          <p className="text-sm text-ink/60">Each JD requirement is matched against your resume via vector search.</p>
        </div>
        <div>
          <p className="font-display text-2xl mb-2">03</p>
          <h3 className="font-medium mb-1">Practice & get scored</h3>
          <p className="text-sm text-ink/60">Answer in your own words, get feedback against a model STAR answer.</p>
        </div>
      </section>
    </div>
  )
}
