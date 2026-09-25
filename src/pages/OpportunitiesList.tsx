import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import StatusBadge from '../components/ui/StatusBadge'
import LoadState from '../components/ui/LoadState'
import {
  formatDateTime,
  deadlineLabel,
  downloadFile,
  calendarFile
} from '../lib/notifications'
import { STATUS_LABELS, FUNDING_LABELS, CATEGORY_LABELS } from '../lib/types'

export default function OpportunitiesList() {
  const { opportunities, loading, error, refetch } = useOpportunities()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') || 'all'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [funding, setFunding] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('deadline')
  const [notice, setNotice] = useState('')
  const now = Date.now()
  const filtered = opportunities
    .filter((o) => {
      const matchesView =
        view === 'all' ||
        (o.status === 'need_to_apply' &&
          o.deadline &&
          (view === 'overdue'
            ? Date.parse(o.deadline) <= now
            : Date.parse(o.deadline) > now))
      return (
        matchesView &&
        `${o.title} ${o.location || ''} ${o.notes || ''}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()) &&
        (status === 'all' || o.status === status) &&
        (funding === 'all' || o.funding_type === funding) &&
        (category === 'all' || o.category === category)
      )
    })
    .sort((a, b) =>
      sort === 'updated'
        ? Date.parse(b.updated_at) - Date.parse(a.updated_at)
        : sort === 'title'
          ? a.title.localeCompare(b.title)
          : (a.deadline ? Date.parse(a.deadline) : Infinity) -
            (b.deadline ? Date.parse(b.deadline) : Infinity)
    )
  if (loading || error)
    return <LoadState loading={loading} error={error} retry={refetch} />
  return (
    <div className="space-y-6">
      <header className="page-heading">
        <div>
          <p className="eyebrow">ALL YOUR POSSIBILITIES, IN ONE PLACE</p>
          <h1>
            The opportunity <span className="marked">notebook.</span>
          </h1>
          <p className="subtitle">
            {opportunities.length} saved · {filtered.length} in this view
          </p>
        </div>
        <Link className="button primary" to="/opportunities/new">
          Add an opportunity
        </Link>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {['all', 'upcoming', 'overdue'].map((v) => (
          <button
            key={v}
            className={`filter-tab ${view === v ? 'selected' : ''}`}
            aria-pressed={view === v}
            onClick={() => setParams(v === 'all' ? {} : { view: v })}
          >
            {v === 'all'
              ? 'All opportunities'
              : v === 'upcoming'
                ? 'Coming up'
                : 'Deadline passed'}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-3">
          <button
            className="text-link"
            disabled={!opportunities.length}
            onClick={() => {
              downloadFile(
                `oppnote-backup-${new Date().toISOString().slice(0, 10)}.json`,
                JSON.stringify(
                  {
                    version: 1,
                    exported_at: new Date().toISOString(),
                    opportunities
                  },
                  null,
                  2
                ),
                'application/json'
              )
              setNotice(
                `Exported all ${opportunities.length} opportunities. Store the file somewhere safe.`
              )
            }}
          >
            Export backup
          </button>
          <button
            className="text-link"
            disabled={
              !opportunities.some(
                (o) =>
                  o.status === 'need_to_apply' &&
                  o.deadline &&
                  Date.parse(o.deadline) > now
              )
            }
            onClick={() => {
              downloadFile(
                'oppnote-deadlines.ics',
                calendarFile(opportunities),
                'text/calendar'
              )
              setNotice(
                'Import the downloaded file into your calendar, then check its reminder settings. Export again after changing deadlines.'
              )
            }}
          >
            Calendar
          </button>
        </div>
      </div>
      {notice && (
        <p role="status" className="success-notice">
          {notice}
        </p>
      )}
      <div className="filter-bar">
        <label className="search-field">
          Search
          <input
            type="search"
            placeholder="Title, place, or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Any status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Funding
          <select value={funding} onChange={(e) => setFunding(e.target.value)}>
            <option value="all">Any funding</option>
            {Object.entries(FUNDING_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Any category</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="deadline">Deadline</option>
            <option value="updated">Recently updated</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>
      <div className="paper-panel opportunity-list">
        {filtered.length ? (
          filtered.map((o) => (
            <Link
              key={o.id}
              to={`/opportunities/${o.id}`}
              className="opportunity-row"
            >
              <div className="opportunity-info">
                <span className="eyebrow">
                  {CATEGORY_LABELS[o.category]} ·{' '}
                  {FUNDING_LABELS[o.funding_type]}
                </span>
                <h2>{o.title}</h2>
                <p>
                  {o.location || 'Location not set'} ·{' '}
                  {formatDateTime(o.deadline)}
                </p>
              </div>
              <div className="opportunity-meta">
                <StatusBadge status={o.status} />
                {o.status === 'need_to_apply' && (
                  <span
                    className={`deadline-pill ${o.deadline && Date.parse(o.deadline) - now < 3 * 86400000 ? 'urgent' : ''}`}
                  >
                    {deadlineLabel(o.deadline)}
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-note">
            <h2>
              {opportunities.length
                ? 'No matches on this page.'
                : 'Start with one possibility.'}
            </h2>
            <p>
              {opportunities.length
                ? 'Try another search or clear your filters.'
                : 'Save a link and deadline to start your notebook.'}
            </p>
            {opportunities.length ? (
              <button
                className="text-link mt-4"
                onClick={() => {
                  setSearch('')
                  setStatus('all')
                  setFunding('all')
                  setCategory('all')
                  setParams({})
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link className="button primary mt-4" to="/opportunities/new">
                Add your first opportunity
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
