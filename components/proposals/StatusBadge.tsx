import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProposalStatus } from '@/types'

const statusConfig: Record<ProposalStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
  SUBMITTED: {
    label: 'Diajukan',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  UNDER_REVIEW: {
    label: 'Dalam Review',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  REVISION: {
    label: 'Perlu Revisi',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  },
  APPROVED: {
    label: 'Disetujui',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
}

interface StatusBadgeProps {
  status: ProposalStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      className={cn(
        config.className,
        size === 'lg' && 'text-sm px-3 py-1',
        size === 'sm' && 'text-xs'
      )}
    >
      {config.label}
    </Badge>
  )
}

export { statusConfig }
