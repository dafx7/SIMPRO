import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ReportsPage from '@/components/admin/ReportsPage'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <WelcomeBanner title="Laporan & Statistik" subtitle="Analisis data proposal Tugas Akhir" />
      <ReportsPage />
    </div>
  )
}
