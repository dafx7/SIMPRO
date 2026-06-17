import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProposalStatus } from '@/types'
import { Circle, Send, Clock, FileEdit, CheckCircle2, XCircle } from 'lucide-react'

const statusConfig: Record<ProposalStatus, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    icon: <Circle className="size-3!" />,
  },
  SUBMITTED: {
    label: 'Diajukan',
    className: 'bg-wbi-teal/10 text-wbi-teal-dark hover:bg-wbi-teal/10',
    icon: <Send className="size-3!" />,
  },
  UNDER_REVIEW: {
    label: 'Dalam Penilaian',
    className: 'bg-wbi-gold/10 text-wbi-gold-dark hover:bg-wbi-gold/10',
    icon: <Clock className="size-3!" />,
  },
  REVISION: {
    label: 'Perlu Revisi',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    icon: <FileEdit className="size-3!" />,
  },
  APPROVED: {
    label: 'Disetujui',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
    icon: <CheckCircle2 className="size-3!" />,
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
    icon: <XCircle className="size-3!" />,
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
        'gap-1 font-medium',
        size === 'lg' && 'h-6 px-3 py-1 text-sm',
        size === 'sm' && 'text-xs'
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}

export { statusConfig }
