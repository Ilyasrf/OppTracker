import type { OpportunityStatus } from '../../lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/types'

interface StatusBadgeProps {
  status: OpportunityStatus
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
