import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProposalTable from '@/components/proposals/ProposalTable'
import StatsCard from '@/components/dashboard/StatsCard'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import AdminDashboardCharts from '@/components/admin/AdminDashboardCharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminProposalsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [total, submitted, underReview, approvedThisMonth, rejected] = await Promise.all([
    prisma.proposal.count(),
    prisma.proposal.count({ where: { status: 'SUBMITTED' } }),
    prisma.proposal.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.proposal.count({ where: { status: 'APPROVED', updatedAt: { gte: startOfMonth } } }),
    prisma.proposal.count({ where: { status: 'REJECTED' } }),
  ])

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title="Dashboard Admin"
        subtitle="Ringkasan sistem manajemen proposal Tugas Akhir mahasiswa"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Proposal TA" value={total} icon={FileText} color="blue" />
        <StatsCard title="Menunggu Tindakan" value={submitted + underReview} icon={Clock} color="amber" description="Diajukan + Dalam Penilaian" />
        <StatsCard title="Disetujui Bulan Ini" value={approvedThisMonth} icon={CheckCircle} color="green" />
        <StatsCard title="Ditolak" value={rejected} icon={XCircle} color="red" />
      </div>

      <AdminDashboardCharts />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-wbi-forest/10 text-wbi-forest">
              <FileText className="h-4 w-4" />
            </span>
            Semua Proposal TA Mahasiswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalTable
            showSubmitter
            baseApiUrl="/api/proposals"
            linkPrefix="/proposals"
          />
        </CardContent>
      </Card>
    </div>
  )
}
