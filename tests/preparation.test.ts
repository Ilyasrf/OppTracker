import test from 'node:test'
import assert from 'node:assert/strict'
import { preparationProgress, targetLabel } from '../src/lib/preparation.ts'

test('preparation progress and date-only targets keep their calendar day', () => {
  assert.equal(preparationProgress([]), 0)
  assert.equal(
    preparationProgress([
      { id: '1', title: 'Study', done: true },
      { id: '2', title: 'Practice', done: false },
      { id: '3', title: 'Exam', done: false }
    ]),
    33
  )
  const now = new Date(2026, 8, 19, 23, 59)
  assert.equal(targetLabel(null, now), 'No target date')
  assert.equal(targetLabel('2026-09-19', now), 'Target: today')
  assert.match(targetLabel('2026-09-18', now), /^Overdue · Sep 18, 2026$/)
  assert.match(targetLabel('2026-09-20', now), /^Target: Sep 20, 2026$/)
})
