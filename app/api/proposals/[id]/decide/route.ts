import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { notifyDecision } from '@/lib/notifications'
import { sendDecisionEmail } from '@/lib/email'
import { ProposalStatus } from '@/types'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { decision, adminNotes } = body

    if (!['APPROVED', 'REVISION', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Keputusan tidak valid' }, { status: 400 })
    }

    if ((decision === 'REVISION' || decision === 'REJECTED') && !adminNotes) {
      return NextResponse.json({ error: 'Catatan wajib diisi' }, { status: 400 })
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        submitter: { select: { id: true, fullName: true, email: true } },
      },
    })
    if (!proposal) return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })

    const newStatus = decision as ProposalStatus

    await prisma.$transaction(async (tx) => {
      await tx.proposal.update({
        where: { id },
        data: { status: newStatus, adminNotes: adminNotes || null },
      })

      await tx.statusHistory.create({
        data: {
          proposalId: id,
          fromStatus: proposal.status,
          toStatus: newStatus,
          changedBy: session.user.fullName || session.user.email!,
          notes: adminNotes,
        },
      })
    })

    await notifyDecision(
      proposal.submitter.id,
      proposal.pembimbingId,
      id,
      proposal.title,
      decision,
      session.user.id
    )

    await sendDecisionEmail(
      proposal.submitter.email,
      proposal.submitter.fullName,
      proposal.title,
      id,
      decision,
      adminNotes
    )

    await createAuditLog({
      userId: session.user.id,
      proposalId: id,
      action: 'MAKE_DECISION',
      entityType: 'Proposal',
      entityId: id,
      oldValue: { status: proposal.status },
      newValue: { status: decision, adminNotes },
    })

    return NextResponse.json({ message: 'Keputusan berhasil disimpan' })
  } catch (error) {
    console.error('POST /api/proposals/[id]/decide error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
