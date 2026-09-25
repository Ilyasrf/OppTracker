import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import { STATUS_LABELS, FUNDING_LABELS, CATEGORY_LABELS } from '../lib/types'
import type { OpportunityStatus, FundingType, Category } from '../lib/types'
import { safeUrl, toLocalInput, toStoredDate } from '../lib/notifications'
import LoadState from '../components/ui/LoadState'

export default function OpportunityForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    opportunities,
    loading,
    error: loadError,
    refetch,
    addOpportunity,
    updateOpportunity
  } = useOpportunities()
  const loadedId = useRef<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    url: '',
    deadline: '',
    status: 'need_to_apply' as OpportunityStatus,
    funding_type: 'unknown' as FundingType,
    location: '',
    travel_accommodation: '',
    category: 'other' as Category,
    notes: '',
    applied_date: ''
  })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const opp = opportunities.find((o) => o.id === id)
  useEffect(() => {
    if (id && opp && loadedId.current !== id) {
      setForm({
        title: opp.title,
        url: opp.url || '',
        deadline: toLocalInput(opp.deadline),
        status: opp.status,
        funding_type: opp.funding_type,
        location: opp.location || '',
        travel_accommodation: opp.travel_accommodation || '',
        category: opp.category,
        notes: opp.notes || '',
        applied_date: toLocalInput(opp.applied_date)
      })
      loadedId.current = id
    } else if (!id && location.state?.draft && loadedId.current !== 'draft') {
      const draft = location.state.draft
      setForm((f) => ({
        ...f,
        title: draft.title || '',
        url: draft.url || '',
        funding_type: draft.funding_type || 'unknown',
        category: draft.category || 'other',
        location: draft.location || '',
        travel_accommodation: draft.travel_accommodation || '',
        notes: draft.notes || ''
      }))
      loadedId.current = 'draft'
      setDirty(true)
    }
  }, [id, opp, location.state])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !saving) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, saving])
  const change = (key: keyof typeof form, value: string) => {
    setDirty(true)
    setForm((f) => ({ ...f, [key]: value }))
  }
  if (loading || loadError)
    return <LoadState loading={loading} error={loadError} retry={refetch} />
  if (id && !opp)
    return (
      <div className="paper-panel">
        <h1>Opportunity not found</h1>
        <Link className="text-link" to="/opportunities">
          Back to your notebook
        </Link>
      </div>
    )
  const duplicate = opportunities.find(
    (o) =>
      o.id !== id && safeUrl(form.url) && safeUrl(o.url) === safeUrl(form.url)
  )
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data = {
        ...form,
        title: form.title.trim(),
        url: form.url.trim() || null,
        deadline: toStoredDate(form.deadline, opp?.deadline),
        applied_date: form.applied_date
          ? toStoredDate(form.applied_date, opp?.applied_date)
          : form.status === 'applied' && opp?.status !== 'applied'
            ? new Date().toISOString()
            : null,
        location: form.location.trim() || null,
        travel_accommodation: form.travel_accommodation.trim() || null,
        notes: form.notes.trim() || null
      }
      const result = id
        ? await updateOpportunity(id, data)
        : await addOpportunity(data)
      if (result.error) setError(result.error)
      else {
        setDirty(false)
        navigate(`/opportunities/${result.data!.id}`)
      }
    } catch {
      setError('Check the dates and try again. Your form has been kept.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="eyebrow">MAKE SPACE FOR A POSSIBILITY</p>
        <h1 className="page-title">
          {id ? 'A little update.' : 'Something worth pursuing.'}
        </h1>
        <p className="subtitle">
          {id
            ? 'Keep the details current, so your next step is clear.'
            : 'Start with the basics. You can fill in the rest later.'}
        </p>
      </header>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={saving} className="paper-panel form-grid">
          <label className="wide">
            Opportunity title <span className="text-gray-500">(required)</span>
            <input
              required
              maxLength={300}
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              placeholder="A fellowship, a job, your next chapter…"
            />
          </label>
          <label className="wide">
            Official website
            <input
              type="url"
              value={form.url}
              onChange={(e) => change('url', e.target.value)}
              placeholder="https://example.com/apply"
            />
          </label>
          {duplicate && (
            <p className="wide error-notice">
              This link is already in your notebook:{' '}
              <Link className="text-link" to={`/opportunities/${duplicate.id}`}>
                {duplicate.title}
              </Link>
              . Check before adding another copy.
            </p>
          )}
          <label className="wide">
            Application deadline
            <input
              aria-label="Application deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => change('deadline', e.target.value)}
            />
            <span className="field-hint">
              Local time: {Intl.DateTimeFormat().resolvedOptions().timeZone}.
              Convert the organizer’s deadline to this timezone and verify it on
              the official page.
            </span>
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Funding
            <select
              value={form.funding_type}
              onChange={(e) => change('funding_type', e.target.value)}
            >
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
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input
              value={form.location}
              maxLength={300}
              onChange={(e) => change('location', e.target.value)}
              placeholder="City, country, or remote"
            />
          </label>
          <label className="wide">
            Travel & accommodation
            <input
              value={form.travel_accommodation}
              maxLength={2000}
              onChange={(e) => change('travel_accommodation', e.target.value)}
              placeholder="Flights, housing, stipend…"
            />
          </label>
          <label className="wide">
            Date applied
            <input
              aria-label="Date applied"
              type="datetime-local"
              value={form.applied_date}
              onChange={(e) => change('applied_date', e.target.value)}
            />
            <span className="field-hint">
              Filled with the current time if you mark it Applied and leave this
              blank.
            </span>
          </label>
          <label className="wide">
            Notes & next steps
            <textarea
              rows={5}
              maxLength={20000}
              value={form.notes}
              onChange={(e) => change('notes', e.target.value)}
              placeholder="Next: update my CV.\nPrepare: cover letter + references.\nFollow up: who to contact, and when."
            />
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="error-notice">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button className="button primary" disabled={saving}>
            {saving ? 'Saving…' : id ? 'Save changes' : 'Save opportunity'}
          </button>
          <button
            className="button"
            disabled={saving}
            type="button"
            onClick={() => {
              if (!dirty || window.confirm('Discard your unsaved changes?'))
                navigate(id ? `/opportunities/${id}` : '/opportunities')
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
