import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserManagement from '@/components/admin/UserManagement'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
        <p className="text-gray-500 mt-1">Manajemen akun pengguna sistem SIMPRO</p>
      </div>
      <UserManagement />
    </div>
  )
}
