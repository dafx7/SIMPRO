import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const unreadCount = await prisma.notification.count({
    where: {
      receiverId: session.user.id,
      isRead: false,
    },
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={session.user.role} unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={{
            fullName: session.user.fullName || session.user.name || 'Pengguna',
            email: session.user.email!,
            role: session.user.role,
          }}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
