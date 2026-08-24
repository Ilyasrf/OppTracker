import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import { STATUS_LABELS, FUNDING_LABELS, CATEGORY_LABELS } from '../lib/types'
import type { OpportunityStatus, FundingType, Category } from '../lib/types'

export default function OpportunityForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { opportunities, addOpportunity, updateOpportunity } = useOpportunities()
  const isEditing = Boolean(id)

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
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const opp = opportunities.find(o => o.id === id)
      if (opp) {
        setForm({
          title: opp.title,
          url: opp.url || '',
          deadline: opp.deadline ? new Date(opp.deadline).toISOString().slice(0, 16) : '',
          status: opp.status,
          funding_type: opp.funding_type,
          location: opp.location || '',
          travel_accommodation: opp.travel_accommodation || '',
          category: opp.category,
          notes: opp.notes || '',
        })
      }
    }
  }, [isEditing, id, opportunities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const oppData = {
        ...form,
        url: form.url || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        location: form.location || null,
        travel_accommodation: form.travel_accommodation || null,
        notes: form.notes || null,
      }

      if (isEditing && id) {
        await updateOpportunity(id, oppData)
      } else {
        await addOpportunity(oppData)
      }
      navigate('/opportunities')
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          {isEditing ? 'Edit Opportunity' : 'Add New Opportunity'}
        </h1>
        <p className="mt-1 text-gray-400">
          {isEditing ? 'Update the details below' : 'Fill in the details below'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
                placeholder="ERA:AI Fellowship Winter 2027"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
                placeholder="https://example.com/apply"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Deadline</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as OpportunityStatus }))}
                  className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Funding</label>
                <select
                  value={form.funding_type}
                  onChange={e => setForm(f => ({ ...f, funding_type: e.target.value as FundingType }))}
                  className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
                >
                  {Object.entries(FUNDING_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                  className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
                  placeholder="Cambridge, UK"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Travel & Accommodation</label>
              <input
                type="text"
                value={form.travel_accommodation}
                onChange={e => setForm(f => ({ ...f, travel_accommodation: e.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
                placeholder="Flights + housing covered, $2000 stipend"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Add Opportunity'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/opportunities')}
            className="rounded-lg border border-dark-border px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
