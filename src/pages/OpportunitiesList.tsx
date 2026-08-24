import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import StatusBadge from '../components/ui/StatusBadge'
import { formatDate, daysUntilDeadline } from '../lib/notifications'
import type { OpportunityStatus, FundingType, Category } from '../lib/types'
import { STATUS_LABELS, FUNDING_LABELS, CATEGORY_LABELS } from '../lib/types'

export default function OpportunitiesList() {
  const { opportunities, loading, deleteOpportunity } = useOpportunities()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all')
  const [fundingFilter, setFundingFilter] = useState<FundingType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  const filtered = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.location?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter
    const matchesFunding = fundingFilter === 'all' || opp.funding_type === fundingFilter
    const matchesCategory = categoryFilter === 'all' || opp.category === categoryFilter
    return matchesSearch && matchesStatus && matchesFunding && matchesCategory
  })

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      await deleteOpportunity(id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Opportunities</h1>
          <p className="mt-1 text-gray-400">{opportunities.length} total opportunities</p>
        </div>
        <Link
          to="/opportunities/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OpportunityStatus | 'all')}
          className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white outline-none focus:border-accent/50"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={fundingFilter}
          onChange={e => setFundingFilter(e.target.value as FundingType | 'all')}
          className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white outline-none focus:border-accent/50"
        >
          <option value="all">All Funding</option>
          {Object.entries(FUNDING_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as Category | 'all')}
          className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white outline-none focus:border-accent/50"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-12 text-center backdrop-blur-sm">
          <p className="text-gray-400">No opportunities found</p>
          <Link to="/opportunities/new" className="mt-4 inline-block text-accent hover:text-accent/80">
            Add your first opportunity
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(opp => {
            const days = daysUntilDeadline(opp.deadline)
            return (
              <div
                key={opp.id}
                className="group flex items-center justify-between rounded-xl border border-dark-border bg-dark-card p-4 backdrop-blur-sm transition-all hover:border-accent/30"
              >
                <Link to={`/opportunities/${opp.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-white group-hover:text-accent">
                        {opp.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        {opp.location && <span>{opp.location}</span>}
                        {opp.location && <span>·</span>}
                        <span>{CATEGORY_LABELS[opp.category]}</span>
                        <span>·</span>
                        <span>{FUNDING_LABELS[opp.funding_type]}</span>
                        {opp.deadline && (
                          <>
                            <span>·</span>
                            <span className={days !== null && days <= 3 ? 'text-red-400' : ''}>
                              Due {formatDate(opp.deadline)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={opp.status} />
                    {days !== null && days <= 7 && days > 0 && (
                      <span className="hidden rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-mono text-yellow-400 sm:inline">
                        {days}d left
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(opp.id, opp.title)}
                  className="ml-4 rounded-lg p-2 text-gray-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
