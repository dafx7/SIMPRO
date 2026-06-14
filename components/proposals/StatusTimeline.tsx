import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CheckCircle2, Circle } from 'lucide-react'
import { StatusHistoryEntry, ProposalStatus } from '@/types'

interface StatusTimelineProps {
  history: StatusHistoryEntry[]
}

const statusLabels: Record<ProposalStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  UNDER_REVIEW: 'Dalam Review',
  REVISION: 'Perlu Revisi',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
}

export default function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada riwayat status.</p>
  }

  return (
    <div className="relative">
      {history.map((entry, index) => (
        <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            {index < history.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {statusLabels[entry.toStatus]}
              </span>
              {entry.fromStatus && (
                <span className="text-xs text-gray-400">
                  dari {statusLabels[entry.fromStatus]}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Oleh <span className="font-medium">{entry.changedBy}</span>
              {' · '}
              {format(new Date(entry.createdAt), 'd MMMM yyyy HH:mm', { locale: id })}
            </p>
            {entry.notes && (
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded p-2">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
