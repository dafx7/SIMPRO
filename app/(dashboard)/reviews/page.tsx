import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/proposals/StatusBadge'
import { ProposalStatus } from '@/types'
import { ClipboardList } from 'lucide-react'

export default async function ReviewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'DOSEN') redirect('/dashboard')

  const assignments = await prisma.reviewerAssignment.findMany({
    where: { pengujiId: session.user.id },
    include: {
      proposal: {
        select: {
          id: true,
          title: true,
          jurusan: true,
          status: true,
          reviewDeadline: true,
          submitter: { select: { fullName: true, nim: true } },
        },
      },
      reviewForm: true,
    },
    orderBy: { assignedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Penilaian Proposal TA</h1>
        <p className="text-gray-500 mt-1">Daftar proposal Tugas Akhir yang perlu Anda nilai</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Belum ada proposal yang ditugaskan kepada Anda sebagai penguji</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const daysLeft = assignment.proposal.reviewDeadline
              ? Math.ceil(
                  (new Date(assignment.proposal.reviewDeadline).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null

            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusBadge status={assignment.proposal.status as ProposalStatus} size="sm" />
                        {assignment.reviewForm ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            ✓ Penilaian Selesai
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            Menunggu Penilaian
                          </span>
                        )}
                        {daysLeft !== null && !assignment.reviewForm && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              daysLeft <= 0
                                ? 'bg-red-100 text-red-700'
                                : daysLeft <= 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {daysLeft <= 0 ? 'Terlambat' : `${daysLeft} hari lagi`}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2">{assignment.proposal.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {assignment.proposal.jurusan} · Mahasiswa: {assignment.proposal.submitter.fullName}
                        {assignment.proposal.submitter.nim ? ` (${assignment.proposal.submitter.nim})` : ''}
                      </p>
                      {assignment.proposal.reviewDeadline && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Batas penilaian:{' '}
                          {format(new Date(assignment.proposal.reviewDeadline), 'd MMMM yyyy', {
                            locale: idLocale,
                          })}
                        </p>
                      )}
                    </div>
                    <Link href={`/proposals/${assignment.proposalId}`}>
                      <Button
                        variant={assignment.reviewForm ? 'outline' : 'default'}
                        size="sm"
                        className={assignment.reviewForm ? '' : 'bg-blue-800 hover:bg-blue-900'}
                      >
                        {assignment.reviewForm ? 'Lihat Detail' : 'Mulai Penilaian'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
