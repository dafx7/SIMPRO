import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NotificationsClient from '@/components/notifications/NotificationList'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <WelcomeBanner title="Notifikasi" subtitle="Semua notifikasi untuk Anda" />
      <NotificationsClient />
    </div>
  )
}
