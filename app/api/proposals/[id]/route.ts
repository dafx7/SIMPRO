import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { notifyAdminsProposalSubmitted } from '@/lib/notifications'
import { sendProposalSubmittedEmail } from '@/lib/email'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    if (!proposal) return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })

    if (session.user.role === 'MAHASISWA' && proposal.submitterId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (
      session.user.role === 'DOSEN' &&
      proposal.pembimbingId !== session.user.id &&
      !proposal.assignments.some((a) => a.pengujiId === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: proposal })
  } catch (error) {
    console.error('GET /api/proposals/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { submitter: { select: { fullName: true, nim: true, email: true } } },
    })
    if (!proposal) return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })

    if (session.user.role === 'MAHASISWA' && proposal.submitterId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (session.user.role === 'DOSEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, abstract, action } = body
    const updateData: Record<string, unknown> = {}

    if (title) updateData.title = title
    if (abstract) updateData.abstract = abstract

    if (action === 'submit' && session.user.role === 'MAHASISWA') {
      updateData.status = 'SUBMITTED'
      updateData.submissionDate = new Date()
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        submitter: { select: { id: true, fullName: true, email: true, nim: true } },
      },
    })

    if (action === 'submit') {
      await prisma.statusHistory.create({
        data: {
          proposalId: id,
          fromStatus: proposal.status,
          toStatus: 'SUBMITTED',
          changedBy: session.user.fullName || session.user.email!,
        },
      })
      await notifyAdminsProposalSubmitted(
        id,
        updated.title,
        proposal.submitter.fullName,
        proposal.submitter.nim,
        session.user.id
      )
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { email: true },
      })
      for (const admin of admins) {
        await sendProposalSubmittedEmail(
          admin.email,
          updated.title,
          proposal.submitter.fullName,
          proposal.submitter.nim
        )
      }
    }

    await createAuditLog({
      userId: session.user.id,
      proposalId: id,
      action: 'UPDATE_PROPOSAL',
      entityType: 'Proposal',
      entityId: id,
      oldValue: { status: proposal.status },
      newValue: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/proposals/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const proposal = await prisma.proposal.findUnique({ where: { id } })

    if (!proposal) return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })
    if (proposal.submitterId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (proposal.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Hanya proposal draft yang dapat dihapus' }, { status: 400 })
    }

    await prisma.proposal.delete({ where: { id } })
    return NextResponse.json({ message: 'Proposal berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/proposals/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
