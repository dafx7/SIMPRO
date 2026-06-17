import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserManagement from '@/components/admin/UserManagement'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <WelcomeBanner title="Kelola Pengguna" subtitle="Manajemen akun pengguna sistem SIMPRO" />
      <UserManagement />
    </div>
  )
}
