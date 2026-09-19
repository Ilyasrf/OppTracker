import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotebook } from '../hooks/useNotebook'
import { useOpportunities } from '../hooks/useOpportunities'
import {
  PREPARATION_KINDS,
  PREPARATION_STATUSES,
  STARTER_TASKS,
  preparationProgress,
  targetLabel,
  type PreparationPlan
} from '../lib/preparation'
import { downloadFile, safeUrl } from '../lib/notifications'

export default function Preparation() {
  const { user } = useAuth()
  const { rows, loading, error, refresh, save } =
    useNotebook<PreparationPlan>('preparation_plans')
  const { opportunities, error: opportunityError } = useOpportunities()
  const [draft, setDraft] = useState<PreparationPlan | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [saveError, setSaveError] = useState('')
  const [filter, setFilter] = useState('active')
  const [search, setSearch] = useState('')
  const recoveryKey = `opptracker-preparation-draft:${user?.id}`

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(recoveryKey)
      if (stored) {
        const recovered = JSON.parse(stored) as PreparationPlan
        if (recovered.user_id === user?.id && Array.isArray(recovered.tasks)) {
          setDraft(recovered)
          setDirty(true)
          setNotice(
            'Recovered your unsaved plan. Review it and save when ready.'
          )
        }
      }
    } catch {
      setSaveError('Could not restore your draft from this browser.')
    }
  }, [recoveryKey, user?.id])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function edit(next: PreparationPlan) {
    setDraft(next)
    setDirty(true)
    setNotice('')
    setSaveError('')
    try {
      sessionStorage.setItem(recoveryKey, JSON.stringify(next))
    } catch {
      setSaveError(
        'Browser draft recovery is unavailable. Save or export your draft before leaving.'
      )
    }
  }
  function open(next: PreparationPlan | null) {
    if (
      dirty &&
      !window.confirm(
        'Discard the unsaved changes to this plan? You can cancel and export your draft first.'
      )
    )
      return
    setDraft(next)
    setDirty(false)
    setNotice('')
    setSaveError('')
    try {
      sessionStorage.removeItem(recoveryKey)
    } catch {
      /* Storage may be disabled. */
    }
  }
  function create() {
    if (!user) return
    if (
      dirty &&
      !window.confirm('Discard the unsaved changes and start a new plan?')
    )
      return
    edit({
      id: crypto.randomUUID(),
      user_id: user.id,
      updated_at: '',
      title: '',
      kind: 'certificate',
      status: 'planned',
      provider: '',
      target_date: null,
      opportunity_id: null,
      notes: '',
      resources: '',
      tasks: []
    })
  }
  const visible = rows
    .filter(
      (row) =>
        (filter === 'all' ||
          (filter === 'active'
            ? !['completed', 'archived'].includes(row.status)
            : row.status === filter)) &&
        `${row.title} ${row.provider} ${PREPARATION_KINDS[row.kind]}`
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .sort((a, b) =>
      (a.target_date || '9999').localeCompare(b.target_date || '9999')
    )
  const completed = rows.filter((row) => row.status === 'completed').length
  const active = rows.filter(
    (row) => !['completed', 'archived'].includes(row.status)
  ).length
  const exportDraft = () =>
    downloadFile(
      'opptracker-preparation.json',
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          plans: rows,
          unsaved_draft: dirty ? draft : null
        },
        null,
        2
      ),
      'application/json'
    )

  return (
    <div className="space-y-7">
      <div className="page-heading">
        <div>
          <p className="eyebrow">The preparation notebook</p>
          <h1>
            Make room for <span className="marked">what’s next.</span>
          </h1>
          <p className="subtitle">
            Certificates, interviews, and courses. One page for every goal.
          </p>
        </div>
        <button
          className="button primary"
          onClick={create}
          disabled={busy || loading || !!error}
        >
          + New plan
        </button>
      </div>
      {!loading && !error && (
        <div className="prep-summary">
          <span>
            <strong>{active}</strong> plans in motion
          </span>
          <span>
            <strong>{completed}</strong> goals completed
          </span>
          <span className="handwritten">A little progress, every day.</span>
        </div>
      )}
      {error && (
        <div role="alert" className="error-notice">
          {error}{' '}
          <button className="text-link" onClick={() => void refresh()}>
            Retry preparation
          </button>
        </div>
      )}
      {loading && <p role="status">Opening your preparation notebook…</p>}
      <div className="notebook-workspace prep-workspace">
        <aside
          className="paper-panel notebook-sidebar"
          aria-label="Preparation plans"
        >
          <div className="section-heading">
            <h2>Your plans</h2>
            <button
              className="text-link"
              disabled={loading || !!error}
              onClick={exportDraft}
            >
              Export plans
            </button>
          </div>
          <label className="block">
            Search plans
            <input
              className="w-full mt-2"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="block mt-3">
            Show
            <select
              className="w-full mt-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="active">Active plans</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
              <option value="all">All plans</option>
            </select>
          </label>
          {!loading && !error && !visible.length && (
            <p className="empty-note">
              {rows.length
                ? 'No plans match this view.'
                : 'Choose a goal. Break it into small steps. Start here.'}
            </p>
          )}
          {visible.map((plan) => (
            <button
              key={plan.id}
              className={`conversation-item ${draft?.id === plan.id ? 'selected' : ''}`}
              disabled={busy}
              aria-pressed={draft?.id === plan.id}
              onClick={() => open(plan)}
            >
              <span className="eyebrow">
                {PREPARATION_KINDS[plan.kind]} ·{' '}
                {PREPARATION_STATUSES[plan.status]}
              </span>
              <strong>{plan.title}</strong>
              <span>{targetLabel(plan.target_date)}</span>
              <progress
                aria-label={`${plan.title} checklist progress`}
                max={100}
                value={preparationProgress(plan.tasks)}
              />
              <span>
                {plan.tasks.filter((task) => task.done).length}/
                {plan.tasks.length} steps done
              </span>
            </button>
          ))}
        </aside>
        {draft ? (
          <form
            className="paper-panel prep-editor"
            onSubmit={async (e) => {
              e.preventDefault()
              if (busy) return
              if (
                !draft.title.trim() ||
                draft.tasks.some((task) => !task.title.trim())
              ) {
                setSaveError(
                  'Give your plan and every checklist step a title before saving.'
                )
                return
              }
              setBusy(true)
              setSaveError('')
              setNotice('')
              try {
                const saved = await save({
                  ...draft,
                  title: draft.title.trim(),
                  tasks: draft.tasks.map((task) => ({
                    ...task,
                    title: task.title.trim()
                  }))
                })
                setDraft(saved)
                setDirty(false)
                setNotice('Plan saved to your account.')
                try {
                  sessionStorage.removeItem(recoveryKey)
                } catch {
                  /* Storage may be disabled. */
                }
              } catch (err) {
                setSaveError(
                  err instanceof Error
                    ? err.message
                    : 'Could not save your plan.'
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            <div className="section-heading">
              <h2>
                {draft.updated_at
                  ? 'Your working page'
                  : 'Start something good.'}
              </h2>
              <span className="handwritten text-2xl">
                {dirty ? 'draft in progress' : 'saved ✓'}
              </span>
            </div>
            {notice && (
              <p role="status" className="success-notice mb-4">
                {notice}
              </p>
            )}
            {saveError && (
              <p role="alert" className="error-notice mb-4">
                {saveError}
              </p>
            )}
            <fieldset disabled={busy} className="min-w-0">
              <div className="form-grid">
                <label className="wide">
                  Plan title
                  <input
                    required
                    maxLength={200}
                    value={draft.title}
                    onChange={(e) => edit({ ...draft, title: e.target.value })}
                    placeholder="AWS certification, an interview, a new skill…"
                  />
                </label>
                <label>
                  Preparation type
                  <select
                    value={draft.kind}
                    onChange={(e) =>
                      edit({
                        ...draft,
                        kind: e.target.value as PreparationPlan['kind']
                      })
                    }
                  >
                    {Object.entries(PREPARATION_KINDS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Progress status
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      edit({
                        ...draft,
                        status: e.target.value as PreparationPlan['status']
                      })
                    }
                  >
                    {Object.entries(PREPARATION_STATUSES).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label>
                  Provider or company
                  <input
                    maxLength={200}
                    value={draft.provider}
                    onChange={(e) =>
                      edit({ ...draft, provider: e.target.value })
                    }
                    placeholder="School, platform, employer…"
                  />
                </label>
                <label>
                  Target date
                  <input
                    type="date"
                    value={draft.target_date || ''}
                    onChange={(e) =>
                      edit({ ...draft, target_date: e.target.value || null })
                    }
                  />
                  <span className="field-hint">
                    A planning date, not an automatic reminder.
                  </span>
                </label>
                <label className="wide">
                  Linked opportunity
                  <select
                    value={draft.opportunity_id || ''}
                    disabled={!!opportunityError}
                    onChange={(e) =>
                      edit({ ...draft, opportunity_id: e.target.value || null })
                    }
                  >
                    <option value="">Independent goal</option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title}
                      </option>
                    ))}
                  </select>
                  {opportunityError && (
                    <span className="field-hint">
                      Opportunities could not load; your existing link will be
                      preserved.
                    </span>
                  )}
                  {draft.opportunity_id && (
                    <Link
                      className="text-link block mt-2"
                      to={`/opportunities/${draft.opportunity_id}`}
                    >
                      Open linked opportunity ↗
                    </Link>
                  )}
                </label>
              </div>
              <section className="mt-7" aria-label="Preparation checklist">
                <div className="section-heading">
                  <h3>One step at a time</h3>
                  {!draft.tasks.length && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        edit({
                          ...draft,
                          tasks: STARTER_TASKS[draft.kind].map((title) => ({
                            id: crypto.randomUUID(),
                            title,
                            done: false
                          }))
                        })
                      }
                    >
                      Use starter checklist
                    </button>
                  )}
                </div>
                <progress
                  className="w-full"
                  aria-label="Checklist progress"
                  value={preparationProgress(draft.tasks)}
                  max={100}
                />
                <p className="field-hint">
                  {draft.tasks.filter((task) => task.done).length} of{' '}
                  {draft.tasks.length} steps done ·{' '}
                  {preparationProgress(draft.tasks)}%
                </p>
                {draft.tasks.map((task, index) => (
                  <div key={task.id} className="prep-task">
                    <input
                      type="checkbox"
                      aria-label={`Complete step ${index + 1}`}
                      checked={task.done}
                      onChange={(e) =>
                        edit({
                          ...draft,
                          tasks: draft.tasks.map((item) =>
                            item.id === task.id
                              ? { ...item, done: e.target.checked }
                              : item
                          )
                        })
                      }
                    />
                    <input
                      aria-label={`Step ${index + 1}`}
                      required
                      maxLength={300}
                      className={task.done ? 'line-through text-gray-400' : ''}
                      value={task.title}
                      onChange={(e) =>
                        edit({
                          ...draft,
                          tasks: draft.tasks.map((item) =>
                            item.id === task.id
                              ? { ...item, title: e.target.value }
                              : item
                          )
                        })
                      }
                    />
                    <button
                      className="text-link"
                      type="button"
                      aria-label={`Remove step ${index + 1}`}
                      onClick={() =>
                        edit({
                          ...draft,
                          tasks: draft.tasks.filter(
                            (item) => item.id !== task.id
                          )
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-link mt-3"
                  disabled={draft.tasks.length >= 100}
                  onClick={() =>
                    edit({
                      ...draft,
                      tasks: [
                        ...draft.tasks,
                        { id: crypto.randomUUID(), title: '', done: false }
                      ]
                    })
                  }
                >
                  + Add a step
                </button>
              </section>
              <div className="form-grid mt-7">
                <label className="wide">
                  Resources
                  <textarea
                    rows={3}
                    maxLength={10000}
                    value={draft.resources}
                    onChange={(e) =>
                      edit({ ...draft, resources: e.target.value })
                    }
                    placeholder="One study link per line. You can also write resource names."
                  />
                </label>
                {draft.resources
                  .split('\n')
                  .filter((line) => safeUrl(line.trim())).length > 0 && (
                  <ul className="wide resource-links">
                    {draft.resources.split('\n').map(
                      (line, index) =>
                        safeUrl(line.trim()) && (
                          <li key={index}>
                            <a
                              className="text-link"
                              href={safeUrl(line.trim())}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {line.trim()} ↗
                            </a>
                          </li>
                        )
                    )}
                  </ul>
                )}
                <label className="wide">
                  Notes & reflections
                  <textarea
                    rows={5}
                    maxLength={20000}
                    value={draft.notes}
                    onChange={(e) => edit({ ...draft, notes: e.target.value })}
                    placeholder="What did you learn? What needs another look?"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  className="button primary"
                  type="submit"
                  disabled={!dirty || loading || !!error}
                >
                  {busy ? 'Saving…' : 'Save plan'}
                </button>
                <button className="button" type="button" onClick={exportDraft}>
                  Export draft
                </button>
                {draft.updated_at && !dirty && (
                  <Link
                    className="button"
                    to="/ai-assistant"
                    state={{
                      prompt:
                        `Help me prepare for this ${PREPARATION_KINDS[draft.kind].toLowerCase()}: ${draft.title}.\nProvider/company: ${draft.provider || 'Not specified'}\nTarget: ${draft.target_date || 'Not set'}\nSteps:\n${draft.tasks.map((task) => `${task.done ? '[done]' : '[todo]'} ${task.title}`).join('\n')}\nMy notes: ${draft.notes.slice(0, 3000)}\nSuggest the next study session or practice interview. Ask me about missing context.`.slice(
                          0,
                          10000
                        )
                    }}
                  >
                    Prepare with AI ↗
                  </Link>
                )}
              </div>
              <p className="field-hint">
                Save changes to sync across devices. Archive finished plans to
                keep their notes. AI coaching opens a draft prompt for you to
                review before sending.
              </p>
            </fieldset>
          </form>
        ) : (
          <div className="focus-card prep-welcome">
            <p className="eyebrow">A place to grow</p>
            <h2>The next opportunity starts with a little preparation.</h2>
            <p className="subtitle">
              Keep your study resources, practice questions, and small wins
              together.
            </p>
            <div className="prep-topics">
              <span className="handwritten">01 / Certificates</span>
              <span className="handwritten">02 / Interviews</span>
              <span className="handwritten">03 / Courses</span>
            </div>
            <button
              className="button ink mt-6"
              onClick={create}
              disabled={busy || loading || !!error}
            >
              Start your first step ↗
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
