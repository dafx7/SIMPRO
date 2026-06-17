'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  UserPlus,
  Star,
  Gavel,
  Clock,
} from 'lucide-react'
import { NotificationData, NotificationType } from '@/types'
import { useRouter } from 'next/navigation'

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; border: string }> = {
  STATUS_CHANGE: { icon: <GitBranch className="w-4 h-4" />, color: 'text-wbi-teal-dark bg-wbi-teal/10', border: 'border-l-wbi-teal' },
  ASSIGNMENT: { icon: <UserPlus className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50', border: 'border-l-purple-400' },
  REVIEW_SUBMITTED: { icon: <Star className="w-4 h-4" />, color: 'text-wbi-gold-dark bg-wbi-gold/10', border: 'border-l-wbi-gold' },
  DECISION_MADE: { icon: <Gavel className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-400' },
  DEADLINE_REMINDER: { icon: <Clock className="w-4 h-4" />, color: 'text-red-600 bg-red-50', border: 'border-l-red-400' },
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=15`)
      const data = await res.json()
      setNotifications(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      toast.success('Semua notifikasi ditandai telah dibaca')
      fetchNotifications()
      router.refresh()
    } catch {
      toast.error('Gagal menandai notifikasi')
    } finally {
      setIsMarkingAll(false)
    }
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{unreadCount} belum dibaca</span>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={isMarkingAll}
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Tandai Semua Dibaca
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 border rounded-2xl bg-white">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.STATUS_CHANGE
            const proposalLink = notif.proposalId ? `/proposals/${notif.proposalId}` : null

            return (
              <div
                key={notif.id}
                className={`flex gap-3 p-4 border border-l-4 rounded-2xl transition-colors ${config.border} ${
                  !notif.isRead ? 'bg-wbi-teal/5' : 'bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.isRead ? 'font-bold text-wbi-forest' : 'font-medium text-gray-800'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-wbi-gold flex-shrink-0" />
                  )}
                  {proposalLink && (
                    <Link href={proposalLink} onClick={() => !notif.isRead && markRead(notif.id)}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Lihat
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" className="rounded-full" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" className="rounded-full" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
