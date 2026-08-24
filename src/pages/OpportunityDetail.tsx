import { useParams, useNavigate, Link } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import StatusBadge from '../components/ui/StatusBadge'
import { formatDate, daysUntilDeadline } from '../lib/notifications'
import { FUNDING_LABELS, CATEGORY_LABELS, type OpportunityStatus } from '../lib/types'

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { opportunities, deleteOpportunity, updateOpportunity } = useOpportunities()
  const opp = opportunities.find(o => o.id === id)

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400">Opportunity not found</p>
        <Link to="/opportunities" className="mt-4 text-accent hover:text-accent/80">
          Back to list
        </Link>
      </div>
    )
  }

  const days = daysUntilDeadline(opp.deadline)

  const handleDelete = async () => {
    if (window.confirm(`Delete "${opp.title}"?`)) {
      await deleteOpportunity(opp.id)
      navigate('/opportunities')
    }
  }

  const handleStatusChange = async (newStatus: typeof opp.status) => {
    await updateOpportunity(opp.id, { status: newStatus })
  }

  const nextStatuses: OpportunityStatus[] = (() => {
    switch (opp.status) {
      case 'need_to_apply': return ['applied', 'scam']
      case 'applied': return ['under_review', 'rejected']
      case 'under_review': return ['interview', 'rejected']
      case 'interview': return ['accepted', 'rejected']
      default: return []
    }
  })()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/opportunities" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-white">{opp.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/opportunities/${opp.id}/edit`}
            className="rounded-lg border border-dark-border px-3 py-2 text-sm text-gray-400 hover:text-white"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Status</p>
            <div className="mt-1"><StatusBadge status={opp.status} /></div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Deadline</p>
            <p className="mt-1 text-sm text-white">{formatDate(opp.deadline)}</p>
            {days !== null && (
              <p className={`text-xs ${days <= 3 ? 'text-red-400' : 'text-gray-400'}`}>
                {days <= 0 ? 'Passed' : `${days} days left`}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Funding</p>
            <p className="mt-1 text-sm text-white">{FUNDING_LABELS[opp.funding_type]}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Category</p>
            <p className="mt-1 text-sm text-white">{CATEGORY_LABELS[opp.category]}</p>
          </div>
        </div>

        {(opp.url || opp.location || opp.travel_accommodation) && (
          <div className="mt-4 space-y-3 border-t border-dark-border pt-4">
            {opp.url && (
              <div>
                <p className="text-xs font-medium text-gray-500">URL</p>
                <a href={opp.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-accent hover:text-accent/80">
                  {opp.url}
                </a>
              </div>
            )}
            {opp.location && (
              <div>
                <p className="text-xs font-medium text-gray-500">Location</p>
                <p className="mt-1 text-sm text-white">{opp.location}</p>
              </div>
            )}
            {opp.travel_accommodation && (
              <div>
                <p className="text-xs font-medium text-gray-500">Travel & Accommodation</p>
                <p className="mt-1 text-sm text-white">{opp.travel_accommodation}</p>
              </div>
            )}
          </div>
        )}

        {opp.notes && (
          <div className="mt-4 border-t border-dark-border pt-4">
            <p className="text-xs font-medium text-gray-500">Notes</p>
            <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">{opp.notes}</p>
          </div>
        )}
      </div>

      {nextStatuses.length > 0 && (
        <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-medium text-gray-400">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className="rounded-lg border border-dark-border px-4 py-2 text-sm text-gray-300 transition-colors hover:border-accent/30 hover:text-white"
              >
                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
