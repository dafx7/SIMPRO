import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ReportsPage from '@/components/admin/ReportsPage'

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan & Statistik</h1>
        <p className="text-gray-500 mt-1">Analisis data proposal penelitian</p>
      </div>
      <ReportsPage />
    </div>
  )
}
