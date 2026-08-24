import { useState } from 'react'
import { useOpportunities } from '../hooks/useOpportunities'
import { formatDate } from '../lib/notifications'

export default function ScamList() {
  const { opportunities, loading, updateOpportunity } = useOpportunities()
  const [markingId, setMarkingId] = useState<string | null>(null)

  const scamOpportunities = opportunities.filter(o => o.status === 'scam')
  const nonScamOpportunities = opportunities.filter(o => o.status !== 'scam')

  const markAsScam = async (id: string) => {
    setMarkingId(id)
    await updateOpportunity(id, { status: 'scam' })
    setMarkingId(null)
  }

  const unmarkScam = async (id: string) => {
    setMarkingId(id)
    await updateOpportunity(id, { status: 'need_to_apply' })
    setMarkingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Scam List</h1>
        <p className="mt-1 text-gray-400">Track and avoid scam opportunities</p>
      </div>

      {/* Marked as Scam */}
      <div>
        <h2 className="mb-4 font-mono text-lg font-semibold text-red-400">
          Known Scams ({scamOpportunities.length})
        </h2>
        {scamOpportunities.length === 0 ? (
          <div className="rounded-xl border border-dark-border bg-dark-card p-8 text-center backdrop-blur-sm">
            <p className="text-gray-500">No scams marked yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scamOpportunities.map(opp => (
              <div
                key={opp.id}
                className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-4 backdrop-blur-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      SCAM
                    </span>
                    <h3 className="truncate text-sm font-medium text-white">{opp.title}</h3>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    {opp.location && <span>{opp.location}</span>}
                    <span>·</span>
                    <span>Added {formatDate(opp.created_at)}</span>
                    {opp.url && (
                      <>
                        <span>·</span>
                        <a href={opp.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                          Source
                        </a>
                      </>
                    )}
                  </div>
                  {opp.notes && (
                    <p className="mt-2 text-xs text-gray-400">{opp.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => unmarkScam(opp.id)}
                  disabled={markingId === opp.id}
                  className="ml-4 rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-white disabled:opacity-50"
                >
                  Unmark
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mark as Scam */}
      {nonScamOpportunities.length > 0 && (
        <div>
          <h2 className="mb-4 font-mono text-lg font-semibold text-gray-400">
            Mark as Scam
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            See an opportunity that looks suspicious? Mark it as a scam to keep track.
          </p>
          <div className="space-y-2">
            {nonScamOpportunities.map(opp => (
              <div
                key={opp.id}
                className="flex items-center justify-between rounded-lg border border-dark-border bg-dark-card p-3 backdrop-blur-sm transition-colors hover:border-dark-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-300">{opp.title}</p>
                  <p className="text-xs text-gray-500">{opp.location || 'No location'}</p>
                </div>
                <button
                  onClick={() => markAsScam(opp.id)}
                  disabled={markingId === opp.id}
                  className="ml-4 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  {markingId === opp.id ? 'Marking...' : 'Mark as Scam'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
