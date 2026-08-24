import { Link } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import StatsCard from '../components/ui/StatsCard'
import StatusBadge from '../components/ui/StatusBadge'
import { daysUntilDeadline, formatDate } from '../lib/notifications'

export default function Dashboard() {
  const { opportunities, loading } = useOpportunities()

  const stats = {
    total: opportunities.length,
    needToApply: opportunities.filter(o => o.status === 'need_to_apply').length,
    applied: opportunities.filter(o => o.status === 'applied').length,
    underReview: opportunities.filter(o => o.status === 'under_review').length,
    interview: opportunities.filter(o => o.status === 'interview').length,
    accepted: opportunities.filter(o => o.status === 'accepted').length,
    rejected: opportunities.filter(o => o.status === 'rejected').length,
  }

  const upcomingDeadlines = opportunities
    .filter(o => o.deadline && o.status !== 'rejected' && o.status !== 'scam')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)

  const recentAdditions = [...opportunities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

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
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-gray-400">Track your international opportunities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          label="Total"
          value={stats.total}
          color="text-white"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatsCard
          label="Need to Apply"
          value={stats.needToApply}
          color="text-yellow-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Applied"
          value={stats.applied}
          color="text-blue-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Interviews"
          value={stats.interview}
          color="text-cyan-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-lg font-semibold text-white">Upcoming Deadlines</h2>
            <Link to="/opportunities" className="text-sm text-accent hover:text-accent/80">
              View all
            </Link>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map(opp => {
                const days = daysUntilDeadline(opp.deadline)
                return (
                  <Link
                    key={opp.id}
                    to={`/opportunities/${opp.id}`}
                    className="flex items-center justify-between rounded-lg border border-dark-border bg-dark/50 p-3 transition-colors hover:border-accent/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{opp.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(opp.deadline)}</p>
                    </div>
                    {days !== null && (
                      <span className={`ml-4 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-mono ${
                        days <= 3 ? 'bg-red-500/20 text-red-400' :
                        days <= 7 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {days <= 0 ? 'Passed' : `${days}d left`}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-lg font-semibold text-white">Recent Activity</h2>
            <Link to="/opportunities" className="text-sm text-accent hover:text-accent/80">
              View all
            </Link>
          </div>
          {recentAdditions.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No opportunities yet</p>
          ) : (
            <div className="space-y-3">
              {recentAdditions.map(opp => (
                <Link
                  key={opp.id}
                  to={`/opportunities/${opp.id}`}
                  className="flex items-center justify-between rounded-lg border border-dark-border bg-dark/50 p-3 transition-colors hover:border-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{opp.title}</p>
                    <p className="text-xs text-gray-400">{opp.location || 'No location'}</p>
                  </div>
                  <StatusBadge status={opp.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
