import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const proposal = await prisma.proposal.findUnique({ where: { id } })
    if (!proposal) return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })

    if (session.user.role === 'MAHASISWA' && proposal.submitterId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (session.user.role === 'DOSEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya file PDF yang diizinkan' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const fileName = `${id}-${Date.now()}.pdf`
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    await prisma.proposal.update({
      where: { id },
      data: {
        documentPath: `/uploads/${fileName}`,
        documentName: file.name,
      },
    })

    return NextResponse.json({
      data: { documentPath: `/uploads/${fileName}`, documentName: file.name },
    })
  } catch (error) {
    console.error('POST /api/proposals/[id]/document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
