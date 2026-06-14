import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const jurusan = searchParams.get('jurusan')
    const type = searchParams.get('type') || 'summary'

    const where: Record<string, unknown> = {}
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }
    if (jurusan) where.jurusan = { contains: jurusan, mode: 'insensitive' }

    if (type === 'audit') {
      const auditLogs = await prisma.auditLog.findMany({
        where: startDate || endDate ? {
          createdAt: where.createdAt as object,
        } : {},
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { fullName: true, email: true } },
          proposal: { select: { title: true } },
        },
      })
      return NextResponse.json({ data: auditLogs })
    }

    const [
      proposals,
      statusCounts,
      jurusanCounts,
      monthlyData,
    ] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: { select: { fullName: true, email: true, nim: true } },
          pembimbing: { select: { fullName: true } },
          assignments: {
            include: {
              penguji: { select: { fullName: true } },
              reviewForm: true,
            },
          },
        },
      }),
      prisma.proposal.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.proposal.groupBy({
        by: ['jurusan'],
        where,
        _count: true,
      }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
          COUNT(*) as count
        FROM "Proposal"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,
    ])

    return NextResponse.json({
      data: {
        proposals,
        summary: {
          total: proposals.length,
          byStatus: statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count
            return acc
          }, {} as Record<string, number>),
          byField: jurusanCounts.map((item) => ({
            field: item.jurusan,
            count: item._count,
          })),
          monthly: monthlyData.map((item) => ({
            month: item.month,
            count: Number(item.count),
          })),
        },
      },
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
