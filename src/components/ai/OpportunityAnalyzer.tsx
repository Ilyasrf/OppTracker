import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useGemini, type AnalyzedOpportunity } from '../../hooks/useGemini'
import { FUNDING_LABELS, CATEGORY_LABELS } from '../../lib/types'

export default function OpportunityAnalyzer() {
  const { loading, error, analyzeUrl } = useGemini()
  const navigate = useNavigate()
  const [sourceText, setSourceText] = useState('')
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<AnalyzedOpportunity | null>(null)

  const handleAnalyze = async () => {
    if (!url.trim()) return
    setResult(null)
    const data = await analyzeUrl(url.trim(), sourceText)
    if (data) setResult(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-lg font-semibold text-ink">
          Turn a description into a draft
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Paste the official description and its source link. Review the
          extracted details before saving.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="source-text" className="block text-sm font-medium">
          Official opportunity description
        </label>
        <textarea
          aria-label="Official opportunity description"
          id="source-text"
          rows={6}
          maxLength={20000}
          value={sourceText}
          onChange={(e) => {
            setSourceText(e.target.value)
            setResult(null)
          }}
          className="w-full"
          placeholder="Copy the program description, requirements, and deadline from the official page…"
        />
        <label htmlFor="source-url" className="block text-sm font-medium">
          Source website
        </label>
        <input
          aria-label="Source website"
          id="source-url"
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setResult(null)
          }}
          placeholder="https://example.com/opportunity"
          className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-ink placeholder-gray-500 outline-none focus:border-accent/50"
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !url.trim() || sourceText.trim().length < 40}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-paper transition-all hover:bg-accent/90 disabled:opacity-50"
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
          <p className="field-hint">
            This is extracted from your pasted text. The assistant has not
            visited the website or verified its legitimacy. Confirm the deadline
            and timezone yourself.
          </p>
          <button
            className="button primary"
            onClick={() =>
              navigate('/opportunities/new', {
                state: {
                  draft: {
                    ...result,
                    url,
                    notes: `${result.summary}\n\nRequirements:\n${result.requirements.map((r) => `- ${r}`).join('\n')}\n\nSource mentions deadline: ${result.deadline || 'not specified'}. Verify exact time and timezone before setting the deadline.`
                  }
                }
              })
            }
          >
            Review & save opportunity ↗
          </button>
          <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <h4 className="font-mono text-lg font-semibold text-ink">
                {result.title}
              </h4>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  result.scam_score <= 30
                    ? 'bg-green-500/20 text-green-400'
                    : result.scam_score <= 60
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                }`}
              >
                Unverified AI assessment
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-300">{result.summary}</p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Funding</p>
                <p className="text-ink">
                  {FUNDING_LABELS[result.funding_type]}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Category</p>
                <p className="text-ink">{CATEGORY_LABELS[result.category]}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Location</p>
                <p className="text-ink">{result.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Deadline</p>
                <p className="text-ink">{result.deadline || 'N/A'}</p>
              </div>
            </div>

            {result.travel_accommodation && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">
                  Travel & Accommodation
                </p>
                <p className="text-sm text-ink">
                  {result.travel_accommodation}
                </p>
              </div>
            )}

            {result.requirements.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">
                  Requirements
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-gray-300">
                  {result.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.red_flags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-red-400">Red Flags</p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-300">
                  {result.red_flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
