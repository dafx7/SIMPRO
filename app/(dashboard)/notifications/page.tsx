import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NotificationsClient from '@/components/notifications/NotificationList'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
        <p className="text-gray-500 mt-1">Semua notifikasi untuk Anda</p>
      </div>
      <NotificationsClient />
    </div>
  )
}
