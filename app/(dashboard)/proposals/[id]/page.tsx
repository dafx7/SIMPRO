import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/proposals/StatusBadge'
import StatusTimeline from '@/components/proposals/StatusTimeline'
import ReviewForm from '@/components/reviews/ReviewForm'
import AssignPembimbingModal from '@/components/proposals/AssignPembimbingModal'
import AssignPengujiModal from '@/components/proposals/AssignPengujiModal'
import DecisionModal from '@/components/proposals/DecisionModal'
import { AlertTriangle, Download, Star, UserCheck, Users } from 'lucide-react'
import { ProposalStatus, ReviewRecommendation } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const recommendationLabels: Record<ReviewRecommendation, string> = {
  APPROVE: 'Setujui',
  REVISE: 'Perlu Revisi',
  REJECT: 'Tolak',
}

export default async function ProposalDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      submitter: { select: { id: true, fullName: true, email: true, nim: true, jurusan: true, semester: true } },
      pembimbing: { select: { id: true, fullName: true, email: true, nidn: true, expertise: true } },
      assignments: {
        include: {
          penguji: { select: { id: true, fullName: true, email: true, nidn: true, expertise: true } },
          reviewForm: true,
        },
        orderBy: { assignedAt: 'asc' },
      },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!proposal) notFound()

  const { role, id: userId } = session.user

  if (role === 'MAHASISWA' && proposal.submitterId !== userId) redirect('/proposals')
  if (
    role === 'DOSEN' &&
    proposal.pembimbingId !== userId &&
    !proposal.assignments.some((a) => a.pengujiId === userId)
  ) redirect('/proposals')

  const myAssignment =
    role === 'DOSEN'
      ? proposal.assignments.find((a) => a.pengujiId === userId)
      : null

  const isPembimbing = role === 'DOSEN' && proposal.pembimbingId === userId

  const completedReviews = proposal.assignments.filter((a) => a.reviewForm)
  const canMakeDecision =
    role === 'ADMIN' &&
    proposal.status === 'UNDER_REVIEW' &&
    completedReviews.length >= 1

  const backHref =
    role === 'ADMIN' ? '/admin/proposals' : '/proposals'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={backHref} className="text-sm text-blue-600 hover:underline">
              ← Kembali
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{proposal.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{proposal.jurusan}</p>
        </div>
        <StatusBadge status={proposal.status as ProposalStatus} size="lg" />
      </div>

      {proposal.similarityFlag && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Terdeteksi kemiripan tinggi ({proposal.similarityScore?.toFixed(1)}%) dengan proposal lain.
            Harap tinjau kembali orisinalitas.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi Proposal TA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mahasiswa</p>
                <p className="mt-1 font-medium">{proposal.submitter.fullName}</p>
                {proposal.submitter.nim && (
                  <p className="text-sm text-gray-500">NIM: {proposal.submitter.nim}</p>
                )}
                <p className="text-sm text-gray-400">{proposal.submitter.email}</p>
                {proposal.submitter.jurusan && (
                  <p className="text-sm text-gray-500">{proposal.submitter.jurusan}
                    {proposal.submitter.semester ? ` — Semester ${proposal.submitter.semester}` : ''}
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jurusan</p>
                <p className="mt-1 text-sm">{proposal.jurusan}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Abstrak</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{proposal.abstract}</p>
              </div>
              {proposal.submissionDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tanggal Submit</p>
                    <p className="mt-1 text-sm">
                      {format(new Date(proposal.submissionDate), 'd MMMM yyyy', { locale: idLocale })}
                    </p>
                  </div>
                </>
              )}
              {proposal.reviewDeadline && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batas Penilaian</p>
                  <p className="mt-1 text-sm">
                    {format(new Date(proposal.reviewDeadline), 'd MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
              )}
              {proposal.documentPath && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Dokumen</p>
                    <a href={proposal.documentPath} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        {proposal.documentName || 'Unduh Dokumen'}
                      </Button>
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pembimbing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Dosen Pembimbing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposal.pembimbing ? (
                <div>
                  <p className="font-medium">{proposal.pembimbing.fullName}</p>
                  {proposal.pembimbing.nidn && (
                    <p className="text-sm text-gray-500">NIDN: {proposal.pembimbing.nidn}</p>
                  )}
                  {proposal.pembimbing.expertise && (
                    <p className="text-sm text-gray-500">Keahlian: {proposal.pembimbing.expertise}</p>
                  )}
                  <p className="text-sm text-gray-400">{proposal.pembimbing.email}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Belum ada pembimbing yang ditentukan</p>
              )}
            </CardContent>
          </Card>

          {/* Penguji Info */}
          {proposal.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Dosen Penguji
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposal.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{a.penguji.fullName}</p>
                      {a.penguji.nidn && <p className="text-xs text-gray-500">NIDN: {a.penguji.nidn}</p>}
                      {a.penguji.expertise && <p className="text-xs text-gray-500">{a.penguji.expertise}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {a.status === 'COMPLETED' ? 'Selesai' : 'Menunggu Penilaian'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {proposal.adminNotes && (
            <Card className="border-orange-200">
              <CardHeader><CardTitle className="text-base text-orange-700">Catatan dari Kaprodi</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{proposal.adminNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Dosen Penguji: Form Penilaian */}
          {role === 'DOSEN' && myAssignment && !isPembimbing && !myAssignment.reviewForm && (
            <Card>
              <CardHeader><CardTitle className="text-base">Form Penilaian</CardTitle></CardHeader>
              <CardContent>
                <ReviewForm assignmentId={myAssignment.id} />
              </CardContent>
            </Card>
          )}

          {role === 'DOSEN' && myAssignment?.reviewForm && (
            <Card className="border-green-200">
              <CardHeader><CardTitle className="text-base text-green-700">Penilaian Anda Telah Dikirim</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Orisinalitas', value: myAssignment.reviewForm.originalityScore },
                  { label: 'Metodologi', value: myAssignment.reviewForm.methodologyScore },
                  { label: 'Kelayakan', value: myAssignment.reviewForm.feasibilityScore },
                  { label: 'Relevansi', value: myAssignment.reviewForm.relevanceScore },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= item.value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                ))}
                <Separator />
                <p className="text-sm text-gray-700">{myAssignment.reviewForm.comments}</p>
                <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  Rekomendasi: {recommendationLabels[myAssignment.reviewForm.recommendation as ReviewRecommendation]}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin: Hasil Penilaian Semua Penguji */}
          {role === 'ADMIN' && proposal.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hasil Penilaian Penguji</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposal.assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{assignment.penguji.fullName}</p>
                        <p className="text-xs text-gray-400">{assignment.penguji.expertise}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {assignment.status === 'COMPLETED' ? 'Selesai' : 'Menunggu'}
                      </span>
                    </div>
                    {assignment.reviewForm && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { label: 'Orisinalitas', value: assignment.reviewForm.originalityScore },
                            { label: 'Metodologi', value: assignment.reviewForm.methodologyScore },
                            { label: 'Kelayakan', value: assignment.reviewForm.feasibilityScore },
                            { label: 'Relevansi', value: assignment.reviewForm.relevanceScore },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded p-2">
                              <span>{item.label}</span>
                              <span className="font-bold text-blue-700">{item.value}/5</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">{assignment.reviewForm.comments}</p>
                        <div className="text-xs font-medium px-2 py-1 rounded-full inline-block bg-blue-50 text-blue-700">
                          {recommendationLabels[assignment.reviewForm.recommendation as ReviewRecommendation]}
                        </div>
                        {assignment.recommendationScore && (
                          <p className="text-xs text-gray-500">
                            Rata-rata: <span className="font-bold">{assignment.recommendationScore.toFixed(1)}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Riwayat Status</CardTitle></CardHeader>
            <CardContent>
              <StatusTimeline history={proposal.statusHistory as Parameters<typeof StatusTimeline>[0]['history']} />
            </CardContent>
          </Card>

          {role === 'ADMIN' && proposal.status === 'SUBMITTED' && (
            <AssignPembimbingModal proposalId={proposal.id} currentPembimbingId={proposal.pembimbingId} />
          )}

          {role === 'ADMIN' && (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW') && (
            <AssignPengujiModal
              proposalId={proposal.id}
              currentPengujiIds={proposal.assignments.map((a) => a.pengujiId)}
            />
          )}

          {canMakeDecision && (
            <DecisionModal
              proposalId={proposal.id}
              reviews={completedReviews.map((a) => ({
                reviewerName: a.penguji.fullName,
                originalityScore: a.reviewForm!.originalityScore,
                methodologyScore: a.reviewForm!.methodologyScore,
                feasibilityScore: a.reviewForm!.feasibilityScore,
                relevanceScore: a.reviewForm!.relevanceScore,
                recommendation: a.reviewForm!.recommendation,
                comments: a.reviewForm!.comments,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
