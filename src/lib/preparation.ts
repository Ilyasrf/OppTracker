import type { NotebookRow } from '../hooks/useNotebook'

export const PREPARATION_KINDS = {
  certificate: 'Certificate',
  interview: 'Job interview',
  course: 'Course'
} as const
export const PREPARATION_STATUSES = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  archived: 'Archived'
} as const
export interface PreparationPlan extends NotebookRow {
  title: string
  kind: keyof typeof PREPARATION_KINDS
  status: keyof typeof PREPARATION_STATUSES
  provider: string
  target_date: string | null
  opportunity_id: string | null
  notes: string
  resources: string
  tasks: { id: string; title: string; done: boolean }[]
}

export const STARTER_TASKS = {
  certificate: [
    'Review the exam objectives',
    'Choose study materials',
    'Complete a practice exam',
    'Review weak topics',
    'Book the exam'
  ],
  interview: [
    'Research the role and company',
    'Prepare STAR examples',
    'Practice technical questions',
    'Run a mock interview',
    'Prepare questions for the interviewer'
  ],
  course: [
    'Review the syllabus',
    'Set a weekly study schedule',
    'Complete the lessons',
    'Build a practice project',
    'Review and record what I learned'
  ]
}

export function preparationProgress(tasks: PreparationPlan['tasks']) {
  return tasks.length
    ? Math.round(
        (tasks.filter((task) => task.done).length / tasks.length) * 100
      )
    : 0
}

// Date-only targets stay in the device calendar, without a UTC day shift.
export function targetLabel(date: string | null, now = new Date()) {
  if (!date) return 'No target date'
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const formatted = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return date < today
    ? `Overdue · ${formatted}`
    : date === today
      ? 'Target: today'
      : `Target: ${formatted}`
}
