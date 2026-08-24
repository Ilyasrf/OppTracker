import { useState } from 'react'
import { useGemini, type ScamAnalysis } from '../../hooks/useGemini'
import { useOpportunities } from '../../hooks/useOpportunities'
import { FUNDING_LABELS, CATEGORY_LABELS } from '../../lib/types'
import type { Opportunity, FundingType, Category } from '../../lib/types'

export default function ScamDetector() {
  const { loading, error, detectScam } = useGemini()
  const { opportunities } = useOpportunities()
  const [selectedId, setSelectedId] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [customForm, setCustomForm] = useState({
    title: '',
    url: '',
    funding_type: 'unknown' as FundingType,
    category: 'other' as Category,
    location: '',
    travel_accommodation: '',
    notes: '',
  })
  const [result, setResult] = useState<ScamAnalysis | null>(null)

  const selected = opportunities.find(o => o.id === selectedId)

  const handleAnalyze = async () => {
    let opp: Partial<Opportunity>
    if (customMode) {
      opp = {
        title: customForm.title,
        url: customForm.url || null,
        funding_type: customForm.funding_type,
        category: customForm.category,
        location: customForm.location || null,
        travel_accommodation: customForm.travel_accommodation || null,
        notes: customForm.notes || null,
      }
    } else if (selected) {
      opp = selected
    } else {
      return
    }
    const analysis = await detectScam(opp)
    if (analysis) setResult(analysis)
  }

  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-green-400 bg-green-500/20'
    if (score <= 60) return 'text-yellow-400 bg-yellow-500/20'
    return 'text-red-400 bg-red-500/20'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-lg font-semibold text-white">Scam Detector</h3>
        <p className="mt-1 text-sm text-gray-400">AI-powered analysis to check if an opportunity is legitimate</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCustomMode(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !customMode ? 'bg-accent text-white' : 'border border-dark-border text-gray-400 hover:text-white'
          }`}
        >
          From Tracker
        </button>
        <button
          onClick={() => setCustomMode(true)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            customMode ? 'bg-accent text-white' : 'border border-dark-border text-gray-400 hover:text-white'
          }`}
        >
          Custom Entry
        </button>
      </div>

      {!customMode ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Select Opportunity</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
          >
            <option value="">Choose an opportunity...</option>
            {opportunities.map(o => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Opportunity title"
            value={customForm.title}
            onChange={e => setCustomForm(f => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <input
            type="url"
            placeholder="URL (optional)"
            value={customForm.url}
            onChange={e => setCustomForm(f => ({ ...f, url: e.target.value }))}
            className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={customForm.funding_type}
              onChange={e => setCustomForm(f => ({ ...f, funding_type: e.target.value as FundingType }))}
              className="rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
            >
              {Object.entries(FUNDING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select
              value={customForm.category}
              onChange={e => setCustomForm(f => ({ ...f, category: e.target.value as Category }))}
              className="rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <input
            type="text"
            placeholder="Location (optional)"
            value={customForm.location}
            onChange={e => setCustomForm(f => ({ ...f, location: e.target.value }))}
            className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <textarea
            placeholder="Notes or anything suspicious you noticed..."
            value={customForm.notes}
            onChange={e => setCustomForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading || (!customMode && !selected) || (customMode && !customForm.title)}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent/90 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Run Scam Analysis'}
      </button>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-lg font-semibold text-white">Analysis Result</h4>
              <span className={`rounded-full px-4 py-1.5 text-lg font-bold ${getScoreColor(result.scam_score)}`}>
                {result.scam_score}/100
              </span>
            </div>

            <p className="mt-1 text-sm font-medium text-gray-400">{result.recommendation}</p>
            <p className="mt-3 text-sm text-gray-300">{result.summary}</p>

            {result.green_flags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-green-400 mb-1">Green Flags</p>
                <ul className="space-y-1">
                  {result.green_flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-300">
                      <span className="mt-0.5 text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.red_flags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-red-400 mb-1">Red Flags</p>
                <ul className="space-y-1">
                  {result.red_flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <span className="mt-0.5 text-red-400">⚠</span> {f}
                    </li>
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
