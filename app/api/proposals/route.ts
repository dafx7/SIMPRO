import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { notifyAdminsProposalSubmitted } from '@/lib/notifications'
import { sendProposalSubmittedEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const jurusan = searchParams.get('jurusan') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (session.user.role === 'MAHASISWA') {
      where.submitterId = session.user.id
    } else if (session.user.role === 'DOSEN') {
      where.OR = [
        { pembimbingId: session.user.id },
        { assignments: { some: { pengujiId: session.user.id } } },
      ]
    }
    // ADMIN sees all

    if (search) {
      const searchOr = [
        { title: { contains: search, mode: 'insensitive' } },
        { submitter: { fullName: { contains: search, mode: 'insensitive' } } },
        { submitter: { nim: { contains: search, mode: 'insensitive' } } },
      ]
      where.AND = where.AND ? [...(where.AND as object[]), { OR: searchOr }] : [{ OR: searchOr }]
    }
    if (status) where.status = status
    if (jurusan) where.jurusan = { contains: jurusan, mode: 'insensitive' }
    if (startDate) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(startDate) }
    if (endDate) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(endDate) }

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: { select: { id: true, fullName: true, email: true, nim: true, jurusan: true, semester: true } },
          pembimbing: { select: { id: true, fullName: true, email: true, nidn: true, expertise: true } },
          assignments: {
            include: {
              penguji: { select: { id: true, fullName: true, email: true, nidn: true, expertise: true } },
              reviewForm: true,
            },
          },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      }),
      prisma.proposal.count({ where }),
    ])

    return NextResponse.json({
      data: proposals,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/proposals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'MAHASISWA') {
      return NextResponse.json({ error: 'Hanya mahasiswa yang dapat mengajukan proposal TA' }, { status: 403 })
    }

    const body = await req.json()
    const { title, abstract, action } = body

    const mahasiswa = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { jurusan: true, fullName: true, nim: true },
    })

    if (!mahasiswa?.jurusan) {
      return NextResponse.json({ error: 'Data jurusan mahasiswa belum lengkap' }, { status: 400 })
    }

    const isSubmit = action === 'submit'
    const status = isSubmit ? 'SUBMITTED' : 'DRAFT'

    const proposal = await prisma.proposal.create({
      data: {
        title,
        abstract,
        jurusan: mahasiswa.jurusan,
        status,
        submitterId: session.user.id,
        submissionDate: isSubmit ? new Date() : null,
      },
      include: { submitter: { select: { id: true, fullName: true, email: true, nim: true } } },
    })

    await prisma.statusHistory.create({
      data: {
        proposalId: proposal.id,
        fromStatus: null,
        toStatus: status,
        changedBy: mahasiswa.fullName,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      proposalId: proposal.id,
      action: isSubmit ? 'SUBMIT_PROPOSAL' : 'CREATE_DRAFT',
      entityType: 'Proposal',
      entityId: proposal.id,
      newValue: { title, status },
    })

    if (isSubmit) {
      await notifyAdminsProposalSubmitted(proposal.id, proposal.title, mahasiswa.fullName, mahasiswa.nim, session.user.id)
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { email: true } })
      for (const admin of admins) {
        await sendProposalSubmittedEmail(admin.email, proposal.title, mahasiswa.fullName, mahasiswa.nim)
      }
    }

    return NextResponse.json({ data: proposal }, { status: 201 })
  } catch (error) {
    console.error('POST /api/proposals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
