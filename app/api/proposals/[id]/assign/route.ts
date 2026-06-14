import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { notifyPembimbingAssigned, notifyPengujiAssigned } from '@/lib/notifications'
import { sendPembimbingAssignedEmail, sendPengujiAssignedEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { type, pembimbingId, pengujiIds, reviewDeadline } = body

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        submitter: { select: { id: true, fullName: true, email: true, nim: true } },
      },
    })
    if (!proposal) return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })

    if (type === 'pembimbing') {
      if (!pembimbingId) {
        return NextResponse.json({ error: 'Pembimbing wajib dipilih' }, { status: 400 })
      }

      await prisma.proposal.update({
        where: { id },
        data: { pembimbingId },
      })

      await prisma.statusHistory.create({
        data: {
          proposalId: id,
          fromStatus: proposal.status,
          toStatus: proposal.status,
          changedBy: session.user.fullName || session.user.email!,
          notes: 'Pembimbing TA ditentukan',
        },
      })

      const pembimbing = await prisma.user.findUnique({
        where: { id: pembimbingId },
        select: { fullName: true, email: true },
      })

      if (pembimbing) {
        await notifyPembimbingAssigned(
          pembimbingId,
          proposal.submitter.id,
          id,
          proposal.title,
          proposal.submitter.fullName,
          session.user.id
        )
        await sendPembimbingAssignedEmail(
          pembimbing.email,
          pembimbing.fullName,
          proposal.title,
          proposal.submitter.fullName,
          id
        )
      }

      await createAuditLog({
        userId: session.user.id,
        proposalId: id,
        action: 'ASSIGN_PEMBIMBING',
        entityType: 'Proposal',
        entityId: id,
        newValue: { pembimbingId },
      })

      return NextResponse.json({ message: 'Pembimbing berhasil ditugaskan' })
    }

    if (type === 'penguji') {
      if (!pengujiIds || pengujiIds.length < 1) {
        return NextResponse.json({ error: 'Minimal 1 penguji harus dipilih' }, { status: 400 })
      }

      const deadline = new Date(reviewDeadline)

      await prisma.$transaction(async (tx) => {
        for (const pengujiId of pengujiIds) {
          await tx.reviewerAssignment.upsert({
            where: { proposalId_pengujiId: { proposalId: id, pengujiId } },
            update: { status: 'ASSIGNED', assignedAt: new Date() },
            create: { proposalId: id, pengujiId, status: 'ASSIGNED' },
          })
        }

        await tx.proposal.update({
          where: { id },
          data: { status: 'UNDER_REVIEW', reviewDeadline: deadline },
        })

        await tx.statusHistory.create({
          data: {
            proposalId: id,
            fromStatus: proposal.status,
            toStatus: 'UNDER_REVIEW',
            changedBy: session.user.fullName || session.user.email!,
            notes: `Ditugaskan ke ${pengujiIds.length} penguji`,
          },
        })
      })

      const pengujis = await prisma.user.findMany({
        where: { id: { in: pengujiIds } },
        select: { id: true, fullName: true, email: true },
      })

      for (const penguji of pengujis) {
        await notifyPengujiAssigned(
          penguji.id,
          proposal.submitter.id,
          id,
          proposal.title,
          proposal.submitter.fullName,
          proposal.submitter.nim,
          session.user.id
        )
        await sendPengujiAssignedEmail(
          penguji.email,
          penguji.fullName,
          proposal.title,
          proposal.submitter.fullName,
          proposal.submitter.nim,
          id,
          deadline
        )
      }

      await createAuditLog({
        userId: session.user.id,
        proposalId: id,
        action: 'ASSIGN_PENGUJI',
        entityType: 'Proposal',
        entityId: id,
        newValue: { pengujiIds, deadline: reviewDeadline },
      })

      return NextResponse.json({ message: 'Penguji berhasil ditugaskan' })
    }

    return NextResponse.json({ error: 'Tipe penugasan tidak valid (gunakan pembimbing atau penguji)' }, { status: 400 })
  } catch (error) {
    console.error('POST /api/proposals/[id]/assign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
