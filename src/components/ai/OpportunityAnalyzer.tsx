import { useState } from 'react'
import { useGemini, type AnalyzedOpportunity } from '../../hooks/useGemini'
import { FUNDING_LABELS, CATEGORY_LABELS } from '../../lib/types'

export default function OpportunityAnalyzer() {
  const { loading, error, analyzeUrl } = useGemini()
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<AnalyzedOpportunity | null>(null)

  const handleAnalyze = async () => {
    if (!url.trim()) return
    const data = await analyzeUrl(url.trim())
    if (data) setResult(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-lg font-semibold text-white">Analyze Opportunity URL</h3>
        <p className="mt-1 text-sm text-gray-400">Paste a URL and AI will extract details and check for scams</p>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/opportunity"
          className="flex-1 rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <h4 className="font-mono text-lg font-semibold text-white">{result.title}</h4>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                result.scam_score <= 30 ? 'bg-green-500/20 text-green-400' :
                result.scam_score <= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                Scam Score: {result.scam_score}/100
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-300">{result.summary}</p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Funding</p>
                <p className="text-white">{FUNDING_LABELS[result.funding_type]}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Category</p>
                <p className="text-white">{CATEGORY_LABELS[result.category]}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Location</p>
                <p className="text-white">{result.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Deadline</p>
                <p className="text-white">{result.deadline || 'N/A'}</p>
              </div>
            </div>

            {result.travel_accommodation && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">Travel & Accommodation</p>
                <p className="text-sm text-white">{result.travel_accommodation}</p>
              </div>
            )}

            {result.requirements.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">Requirements</p>
                <ul className="mt-1 list-inside list-disc text-sm text-gray-300">
                  {result.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {result.red_flags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-red-400">Red Flags</p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-300">
                  {result.red_flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
