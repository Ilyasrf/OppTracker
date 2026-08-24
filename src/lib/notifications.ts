export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleDeadlineReminder(title: string, deadline: Date) {
  const now = new Date()
  const threeDaysBefore = new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000)
  
  if (threeDaysBefore <= now) return

  const delay = threeDaysBefore.getTime() - now.getTime()
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Deadline Reminder', {
        body: `"${title}" deadline is in 3 days!`,
        icon: '/favicon.svg',
      })
    }
  }, delay)
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No deadline'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntilDeadline(dateString: string | null): number | null {
  if (!dateString) return null
  const deadline = new Date(dateString)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
