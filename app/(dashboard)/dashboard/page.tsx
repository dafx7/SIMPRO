import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { FileText, CheckCircle, Clock, AlertCircle, BookOpen, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatsCard from '@/components/dashboard/StatsCard'
import StatusBadge from '@/components/proposals/StatusBadge'
import { ProposalStatus } from '@/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { role, id: userId, fullName, nim } = session.user

  if (role === 'ADMIN') redirect('/admin/proposals')

  if (role === 'MAHASISWA') {
    const proposals = await prisma.proposal.findMany({
      where: { submitterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        pembimbing: { select: { fullName: true } },
      },
    })

    const stats = {
      total: proposals.length,
      approved: proposals.filter((p) => p.status === 'APPROVED').length,
      underReview: proposals.filter((p) => p.status === 'UNDER_REVIEW').length,
      revision: proposals.filter((p) => p.status === 'REVISION').length,
      draft: proposals.filter((p) => p.status === 'DRAFT').length,
      submitted: proposals.filter((p) => p.status === 'SUBMITTED').length,
    }

    const recent = proposals.slice(0, 5)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Selamat datang, <strong>{fullName || 'Mahasiswa'}</strong>
            {nim ? ` (NIM: ${nim})` : ''}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Proposal" value={stats.total} icon={FileText} color="blue" />
          <StatsCard title="Disetujui" value={stats.approved} icon={CheckCircle} color="green" />
          <StatsCard title="Dalam Penilaian" value={stats.underReview} icon={Clock} color="amber" />
          <StatsCard title="Perlu Revisi" value={stats.revision} icon={AlertCircle} color="orange" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposal TA Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Belum ada proposal TA</p>
                <Link href="/proposals/new" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
                  Ajukan proposal TA pertama Anda
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recent.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proposals/${p.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.pembimbing ? `Pembimbing: ${p.pembimbing.fullName}` : 'Belum ada pembimbing'} &bull;{' '}
                        {format(new Date(p.createdAt), 'd MMMM yyyy', { locale: id })}
                      </p>
                    </div>
                    <StatusBadge status={p.status as ProposalStatus} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (role === 'DOSEN') {
    const [bimbinganProposals, pengujiAssignments] = await Promise.all([
      prisma.proposal.findMany({
        where: { pembimbingId: userId },
        orderBy: { createdAt: 'desc' },
        include: { submitter: { select: { fullName: true, nim: true } } },
      }),
      prisma.reviewerAssignment.findMany({
        where: { pengujiId: userId },
        include: {
          proposal: {
            select: { id: true, title: true, jurusan: true, reviewDeadline: true, status: true },
          },
          reviewForm: true,
        },
        orderBy: { assignedAt: 'desc' },
      }),
    ])

    const pendingPenilaian = pengujiAssignments.filter((a) => a.status !== 'COMPLETED')

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Dosen</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {fullName || 'Dosen'}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Mahasiswa Bimbingan" value={bimbinganProposals.length} icon={BookOpen} color="blue" />
          <StatsCard title="Penugasan Penguji" value={pengujiAssignments.length} icon={ClipboardList} color="amber" />
          <StatsCard title="Penilaian Selesai" value={pengujiAssignments.filter((a) => a.status === 'COMPLETED').length} icon={CheckCircle} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mahasiswa Bimbingan</CardTitle>
            </CardHeader>
            <CardContent>
              {bimbinganProposals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Belum ada mahasiswa bimbingan</p>
                </div>
              ) : (
                <div className="divide-y">
                  {bimbinganProposals.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      href={`/proposals/${p.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.submitter.fullName}{p.submitter.nim ? ` (${p.submitter.nim})` : ''}
                        </p>
                      </div>
                      <StatusBadge status={p.status as ProposalStatus} size="sm" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Penilaian Menunggu</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPenilaian.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30 text-green-400" />
                  <p>Semua penilaian selesai!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingPenilaian.map((a) => {
                    const daysLeft = a.proposal.reviewDeadline
                      ? Math.ceil(
                          (new Date(a.proposal.reviewDeadline).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null

                    return (
                      <Link
                        key={a.id}
                        href={`/proposals/${a.proposalId}`}
                        className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{a.proposal.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{a.proposal.jurusan}</p>
                        </div>
                        {daysLeft !== null && (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              daysLeft <= 3
                                ? 'bg-red-100 text-red-600'
                                : daysLeft <= 7
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {daysLeft <= 0 ? 'Terlambat' : `${daysLeft} hari lagi`}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  redirect('/login')
}
