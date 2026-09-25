import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import StatusBadge from '../components/ui/StatusBadge'
import LoadState from '../components/ui/LoadState'
import {
  formatDateTime,
  deadlineLabel,
  safeUrl,
  calendarFile,
  downloadFile
} from '../lib/notifications'
import {
  FUNDING_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type OpportunityStatus
} from '../lib/types'

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    opportunities,
    loading,
    error,
    refetch,
    deleteOpportunity,
    updateOpportunity
  } = useOpportunities()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const opp = opportunities.find((o) => o.id === id)
  if (loading || error)
    return <LoadState loading={loading} error={error} retry={refetch} />
  if (!opp)
    return (
      <div className="paper-panel">
        <h1>Opportunity not found</h1>
        <Link className="text-link" to="/opportunities">
          Back to your notebook
        </Link>
      </div>
    )
  const source = safeUrl(opp.url)
  const changeStatus = async (status: OpportunityStatus) => {
    setBusy(true)
    setActionError('')
    setMessage('')
    const result = await updateOpportunity(opp.id, { status })
    if (result.error) setActionError(result.error)
    else setMessage('Status saved.')
    setBusy(false)
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link className="text-link" to="/opportunities">
        Back to your notebook
      </Link>
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {CATEGORY_LABELS[opp.category]} /{' '}
            {opp.location || 'LOCATION NOT SET'}
          </p>
          <h1 className="detail-title">{opp.title}</h1>
        </div>
        <Link className="button" to={`/opportunities/${opp.id}/edit`}>
          Edit details
        </Link>
      </header>
      <section className="paper-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StatusBadge status={opp.status} />
          <span className="handwritten text-2xl">
            {opp.status === 'need_to_apply'
              ? deadlineLabel(opp.deadline)
              : 'one step at a time'}
          </span>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Application deadline</dt>
            <dd>{formatDateTime(opp.deadline)}</dd>
          </div>
          <div>
            <dt>Funding</dt>
            <dd>{FUNDING_LABELS[opp.funding_type]}</dd>
          </div>
          <div>
            <dt>Date applied</dt>
            <dd>
              {opp.applied_date
                ? formatDateTime(opp.applied_date)
                : 'Not recorded'}
            </dd>
          </div>
          <div>
            <dt>Travel & accommodation</dt>
            <dd>{opp.travel_accommodation || 'Not specified'}</dd>
          </div>
        </dl>
        {source && (
          <a
            className="button primary"
            href={source}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open official website
          </a>
        )}
        {opp.status === 'need_to_apply' &&
          opp.deadline &&
          Date.parse(opp.deadline) > Date.now() && (
            <button
              className="button ml-0 mt-3 sm:ml-3"
              onClick={() => {
                downloadFile(
                  'opportunity-deadline.ics',
                  calendarFile([opp]),
                  'text/calendar'
                )
                setMessage(
                  'Import the calendar file and check its alerts. Export again if this deadline changes.'
                )
              }}
            >
              Calendar reminder
            </button>
          )}
      </section>
      <section className="paper-panel">
        <div className="section-heading">
          <h2>Notes & next steps</h2>
          <span className="handwritten text-xl">your plan goes here</span>
        </div>
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {opp.notes ||
            'No notes yet. Add your next step, requirements, or a follow-up reminder using Edit details.'}
        </p>
      </section>
      <section className="paper-panel">
        <h2 className="mb-3 text-xl">Where are things at?</h2>
        <label className="block max-w-sm">
          Application status
          <select
            className="mt-2 w-full"
            value={opp.status}
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value as OpportunityStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-sm text-gray-500">
          You can move directly to any stage. Marking Applied records the
          current time if no applied date exists.
        </p>
      </section>
      {message && (
        <p role="status" className="success-notice">
          {message}
        </p>
      )}
      {actionError && (
        <p role="alert" className="error-notice">
          {actionError}
        </p>
      )}
      <details className="danger-zone">
        <summary>Delete this opportunity</summary>
        <p className="my-3 text-sm">
          This permanently removes the record. Export a backup from your
          notebook first.
        </p>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            if (
              window.prompt(
                `To permanently delete this opportunity, type its title exactly:\n${opp.title}`
              ) !== opp.title
            )
              return
            setBusy(true)
            setActionError('')
            const result = await deleteOpportunity(opp.id)
            if (result.error) {
              setActionError(result.error)
              setBusy(false)
            } else navigate('/opportunities')
          }}
        >
          Delete permanently
        </button>
      </details>
    </div>
  )
}
