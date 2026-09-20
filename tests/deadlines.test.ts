import test from 'node:test'
import assert from 'node:assert/strict'
import {
  toLocalInput,
  toStoredDate,
  pendingDeadlines,
  deadlineLabel,
  calendarFile,
  safeUrl
} from '../src/lib/notifications.ts'
import type { Opportunity } from '../src/lib/types.ts'
const now = Date.parse('2026-09-18T12:00:00Z')
const make = (id: string, deadline: string | null, status = 'need_to_apply') =>
  ({
    id,
    deadline,
    status,
    title: 'Fellowship, notes; ü '.repeat(10),
    url: 'https://example.com'
  }) as Opportunity
const opportunities = [
  make('past', '2026-09-17T12:00:00Z'),
  make('next', '2026-09-19T12:00:00Z'),
  make('applied', '2026-09-18T15:00:00Z', 'applied'),
  make('accepted', '2026-09-20T12:00:00Z', 'accepted'),
  make('none', null),
  make('invalid', 'bad-date')
]

test('upcoming deadlines exclude past, applied, accepted, and invalid records without mutation', () => {
  const copy = structuredClone(opportunities)
  const result = pendingDeadlines(opportunities, now)
  assert.deepEqual(
    result.upcoming.map((o) => o.id),
    ['next']
  )
  assert.deepEqual(
    result.overdue.map((o) => o.id),
    ['past']
  )
  assert.deepEqual(opportunities, copy)
})
test('deadline boundary uses hours and exact timestamps', () => {
  assert.equal(deadlineLabel('2026-09-18T12:00:00Z', now), 'Deadline passed')
  assert.equal(deadlineLabel('2026-09-18T12:30:00Z', now), 'Less than 1 hour')
  assert.equal(deadlineLabel('2026-09-18T16:00:00Z', now), '4 hours left')
})
test('unchanged local date inputs round-trip without moving the deadline across timezones', () => {
  const old = process.env.TZ
  try {
    for (const tz of [
      'Africa/Casablanca',
      'America/New_York',
      'Asia/Kathmandu'
    ]) {
      process.env.TZ = tz
      for (const value of [
        '2026-09-18T17:30:00.000Z',
        '2026-01-20T23:45:00.000Z'
      ])
        assert.equal(new Date(toLocalInput(value)).toISOString(), value)
    }
    assert.equal(toLocalInput('invalid'), '')
  } finally {
    if (old) process.env.TZ = old
    else delete process.env.TZ
  }
})
test('calendar includes only upcoming unsubmitted applications, UTC and valid UTF-8 folded lines', () => {
  const ics = calendarFile(opportunities, now)
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1)
  assert.ok(ics.includes('DTSTART:20260919T120000Z'))
  assert.ok(ics.includes('UID:next@oppnote'))
  for (const alarm of ['-P3D', '-P1D', '-PT1H'])
    assert.ok(ics.includes(`TRIGGER:${alarm}`))
  assert.ok(ics.replace(/\r\n /g, '').includes('Fellowship\\, notes\\; ü'))
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75)
})
test('links cannot use executable protocols or embedded credentials', () => {
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'https://user:pass@example.com',
    '/relative'
  ])
    assert.equal(safeUrl(value), undefined)
  assert.equal(safeUrl('https://example.com'), 'https://example.com/')
})

test('editing another field preserves original date precision', () => {
  const value = '2026-09-18T17:30:29.456Z'
  assert.equal(toStoredDate(toLocalInput(value), value), value)
  assert.equal(toStoredDate('', value), null)
})
