import type { Opportunity } from './types'

export function formatDate(
  value: string | null,
  fallback = 'No deadline'
): string {
  if (!value || !Number.isFinite(Date.parse(value))) return fallback
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'No deadline'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

export function toLocalInput(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toStoredDate(
  value: string,
  previous: string | null = null
): string | null {
  if (!value) return null
  return previous && value === toLocalInput(previous)
    ? previous
    : new Date(value).toISOString()
}

export function daysUntilDeadline(
  value: string | null,
  now = Date.now()
): number | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null
  return Math.ceil((Date.parse(value) - now) / 86400000)
}

export function deadlineLabel(value: string | null, now = Date.now()): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'No deadline'
  const diff = Date.parse(value) - now
  if (diff <= 0) return 'Deadline passed'
  if (diff < 3600000) return 'Less than 1 hour'
  if (diff < 86400000) return `${Math.ceil(diff / 3600000)} hours left`
  return `${Math.ceil(diff / 86400000)} days left`
}

export function pendingDeadlines(
  opportunities: Opportunity[],
  now = Date.now()
) {
  const pending = opportunities.filter(
    (o) =>
      o.status === 'need_to_apply' &&
      o.deadline &&
      Number.isFinite(Date.parse(o.deadline))
  )
  return {
    upcoming: pending
      .filter((o) => Date.parse(o.deadline!) > now)
      .sort((a, b) => Date.parse(a.deadline!) - Date.parse(b.deadline!)),
    overdue: pending
      .filter((o) => Date.parse(o.deadline!) <= now)
      .sort((a, b) => Date.parse(b.deadline!) - Date.parse(a.deadline!))
  }
}

export function safeUrl(value: string | null): string | undefined {
  try {
    const url = new URL(value || '')
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

const escapeCalendar = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
const calendarDate = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

export function calendarFile(
  opportunities: Opportunity[],
  now = Date.now()
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OppNote//Deadlines//EN',
    'CALSCALE:GREGORIAN'
  ]
  for (const opp of pendingDeadlines(opportunities, now).upcoming) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${opp.id}@oppnote`,
      `DTSTAMP:${calendarDate(new Date(now).toISOString())}`,
      `DTSTART:${calendarDate(opp.deadline!)}`,
      `SUMMARY:${escapeCalendar(`Apply: ${opp.title}`)}`,
      `DESCRIPTION:${escapeCalendar(`Application deadline. Verify the time on the official page. ${safeUrl(opp.url) || ''}`)}`
    )
    for (const trigger of ['-P3D', '-P1D', '-PT1H'])
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeCalendar(opp.title)}`,
        `TRIGGER:${trigger}`,
        'END:VALARM'
      )
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  // Fold at 75 UTF-8 bytes as required by RFC 5545, without splitting a character.
  return (
    lines
      .map((line) => {
        let result = '',
          bytes = 0
        for (const char of line) {
          const size = new TextEncoder().encode(char).length
          if (bytes + size > 75) {
            result += '\r\n '
            bytes = 1
          }
          result += char
          bytes += size
        }
        return result
      })
      .join('\r\n') + '\r\n'
  )
}

export function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
