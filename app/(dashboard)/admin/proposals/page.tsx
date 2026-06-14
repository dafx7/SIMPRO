import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProposalTable from '@/components/proposals/ProposalTable'
import StatsCard from '@/components/dashboard/StatsCard'
import { FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import AdminDashboardCharts from '@/components/admin/AdminDashboardCharts'

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 mt-1">Ringkasan sistem manajemen proposal Tugas Akhir mahasiswa</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Proposal TA" value={total} icon={FileText} color="blue" />
        <StatsCard title="Menunggu Tindakan" value={submitted + underReview} icon={Clock} color="amber" description="Diajukan + Dalam Penilaian" />
        <StatsCard title="Disetujui Bulan Ini" value={approvedThisMonth} icon={CheckCircle} color="green" />
        <StatsCard title="Ditolak" value={rejected} icon={XCircle} color="red" />
      </div>

      <AdminDashboardCharts />

      <div>
        <h2 className="text-lg font-semibold mb-4">Semua Proposal TA Mahasiswa</h2>
        <ProposalTable
          showSubmitter
          baseApiUrl="/api/proposals"
          linkPrefix="/proposals"
        />
      </div>
    </div>
  )
}
