import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { notifyAdminReviewSubmitted, notifyAdminAllReviewsDone } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'DOSEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { assignmentId, originalityScore, methodologyScore, feasibilityScore, relevanceScore, comments, recommendation } = body

    const assignment = await prisma.reviewerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        proposal: { select: { id: true, title: true } },
        reviewForm: true,
      },
    })

    if (!assignment) return NextResponse.json({ error: 'Penugasan tidak ditemukan' }, { status: 404 })
    if (assignment.pengujiId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (assignment.reviewForm) {
      return NextResponse.json({ error: 'Penilaian sudah pernah dikirim' }, { status: 400 })
    }

    const avgScore = (originalityScore + methodologyScore + feasibilityScore + relevanceScore) / 4

    await prisma.$transaction(async (tx) => {
      await tx.reviewForm.create({
        data: {
          assignmentId,
          originalityScore,
          methodologyScore,
          feasibilityScore,
          relevanceScore,
          comments,
          recommendation,
        },
      })

      await tx.reviewerAssignment.update({
        where: { id: assignmentId },
        data: { status: 'COMPLETED', recommendationScore: avgScore },
      })
    })

    await notifyAdminReviewSubmitted(
      assignment.proposal.id,
      assignment.proposal.title,
      session.user.fullName || session.user.email!,
      session.user.id
    )

    const allAssignments = await prisma.reviewerAssignment.findMany({
      where: { proposalId: assignment.proposal.id },
      include: { reviewForm: true },
    })

    const allDone = allAssignments.every((a) => a.status === 'COMPLETED')
    if (allDone) {
      await notifyAdminAllReviewsDone(assignment.proposal.id, assignment.proposal.title)
    }

    await createAuditLog({
      userId: session.user.id,
      proposalId: assignment.proposal.id,
      action: 'SUBMIT_REVIEW',
      entityType: 'ReviewForm',
      entityId: assignmentId,
      newValue: { recommendation, avgScore },
    })

    return NextResponse.json({ message: 'Penilaian berhasil dikirim' }, { status: 201 })
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
