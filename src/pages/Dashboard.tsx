import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import StatusBadge from '../components/ui/StatusBadge'
import LoadState from '../components/ui/LoadState'
import {
  calendarFile,
  deadlineLabel,
  downloadFile,
  formatDateTime,
  pendingDeadlines
} from '../lib/notifications'

export default function Dashboard() {
  const { opportunities, loading, error, refetch } = useOpportunities()
  const [now, setNow] = useState(Date.now())
  const [calendarSaved, setCalendarSaved] = useState(false)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])
  const { upcoming, overdue } = pendingDeadlines(opportunities, now)
  const next = upcoming[0]
  const waiting = opportunities.filter((o) =>
    ['applied', 'under_review'].includes(o.status)
  ).length
  const interviews = opportunities.filter(
    (o) => o.status === 'interview'
  ).length
  const recent = [...opportunities]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, 4)
  if (loading || error)
    return <LoadState loading={loading} error={error} retry={refetch} />

  return (
    <div className="space-y-8">
      <header className="page-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL OPPORTUNITY NOTEBOOK</p>
          <h1>
            Good things take <span className="marked">a little planning.</span>
          </h1>
          <p className="subtitle">
            Keep the possibilities. Catch the deadlines.
          </p>
        </div>
        <Link className="button primary" to="/opportunities/new">
          Add an opportunity
        </Link>
      </header>
      <div className="dashboard-grid">
        <section className="focus-card">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">UP NEXT / APPLICATION DEADLINE</p>
            <span className="handwritten -rotate-6 text-2xl">
              you've got this
            </span>
          </div>
          {next ? (
            <>
              <div className="deadline-stamp">
                {deadlineLabel(next.deadline, now)}
              </div>
              <h2>{next.title}</h2>
              <p className="mt-3 text-sm">
                {formatDateTime(next.deadline)}
                {next.location && ` · ${next.location}`}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link to={`/opportunities/${next.id}`} className="button ink">
                  Open application
                </Link>
                <span className="text-sm">One step closer.</span>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-8">
                {opportunities.length
                  ? 'A little breathing room.'
                  : 'Your next chapter starts here.'}
              </h2>
              <p className="mt-3 max-w-md">
                {opportunities.length
                  ? 'No upcoming application deadlines. Check the items below or save your next possibility.'
                  : 'Save a fellowship, internship, or job. Give it a deadline. Make it happen.'}
              </p>
              <Link to="/opportunities/new" className="button ink mt-7">
                Save a possibility
              </Link>
            </>
          )}
        </section>
        <aside className="paper-panel snapshot">
          <p className="eyebrow">THE BIG PICTURE</p>
          <div className="snapshot-row">
            <span>In your notebook</span>
            <strong>{opportunities.length.toString().padStart(2, '0')}</strong>
          </div>
          <div className="snapshot-row">
            <span>Still to apply</span>
            <strong>
              {opportunities
                .filter((o) => o.status === 'need_to_apply')
                .length.toString()
                .padStart(2, '0')}
            </strong>
          </div>
          <div className="snapshot-row">
            <span>Waiting for a reply</span>
            <strong>{waiting.toString().padStart(2, '0')}</strong>
          </div>
          <div className="snapshot-row">
            <span>Interviews</span>
            <strong>{interviews.toString().padStart(2, '0')}</strong>
          </div>
          <p className="handwritten mt-4 text-center text-2xl">
            small steps, big possibilities.
          </p>
        </aside>
      </div>
      <div className="grid gap-7 lg:grid-cols-2">
        <section className="paper-panel">
          <div className="section-heading">
            <h2>Coming up</h2>
            <Link to="/opportunities?view=upcoming" className="text-link">
              See all
            </Link>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Applications still on your to-do list.
          </p>
          {upcoming.slice(0, 5).map((opp) => (
            <Link
              key={opp.id}
              to={`/opportunities/${opp.id}`}
              className="notebook-row"
            >
              <div>
                <h3>{opp.title}</h3>
                <p>{formatDateTime(opp.deadline)}</p>
              </div>
              <span
                className={`deadline-pill ${Date.parse(opp.deadline!) - now < 3 * 86400000 ? 'urgent' : ''}`}
              >
                {deadlineLabel(opp.deadline, now)}
              </span>
            </Link>
          ))}
          {!upcoming.length && (
            <p className="empty-note">
              Nothing coming up yet. Add a deadline when you save an
              opportunity.
            </p>
          )}
          {upcoming.length > 0 && (
            <div className="calendar-note">
              <button
                className="text-link"
                onClick={() => {
                  downloadFile(
                    'oppnote-deadlines.ics',
                    calendarFile(opportunities),
                    'text/calendar'
                  )
                  setCalendarSaved(true)
                }}
              >
                Add deadlines to my calendar
              </button>
              <p>
                Import the file into your calendar and check its alerts.
                Includes 3-day, 1-day, and 1-hour reminders. Export again when
                deadlines change.
              </p>
              {calendarSaved && (
                <p role="status">
                  Calendar file downloaded. Import it into your preferred
                  calendar to activate reminders.
                </p>
              )}
            </div>
          )}
        </section>
        <section className="paper-panel">
          <div className="section-heading">
            <h2>Recently updated</h2>
            <span className="handwritten text-xl">the latest scribbles</span>
          </div>
          {recent.map((opp) => (
            <Link
              key={opp.id}
              to={`/opportunities/${opp.id}`}
              className="notebook-row"
            >
              <div>
                <h3>{opp.title}</h3>
                <p>{formatDateTime(opp.updated_at)}</p>
              </div>
              <StatusBadge status={opp.status} />
            </Link>
          ))}
          {!recent.length && (
            <p className="empty-note">
              Your saved opportunities will appear here.
            </p>
          )}
          <Link to="/opportunities" className="text-link mt-5 inline-block">
            Open the whole notebook
          </Link>
        </section>
      </div>
      {overdue.length > 0 && (
        <section className="overdue-panel">
          <div>
            <p className="eyebrow">NEEDS A SECOND LOOK</p>
            <h2>
              {overdue.length}{' '}
              {overdue.length === 1 ? 'deadline has' : 'deadlines have'} passed
            </h2>
            <p className="mt-2 text-sm">
              These are still marked “Need to apply.” Update the status if you
              applied, or check whether the deadline was extended.
            </p>
          </div>
          <Link className="button" to="/opportunities?view=overdue">
            Review passed deadlines
          </Link>
        </section>
      )}
    </div>
  )
}
