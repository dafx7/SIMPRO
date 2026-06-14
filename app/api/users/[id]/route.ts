import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { fullName, role, expertise, nidn, nim, jurusan, semester, angkatan, isActive } = body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    if (role === 'DOSEN' || user.role === 'DOSEN') {
      if (expertise !== undefined) updateData.expertise = expertise
      if (nidn !== undefined) updateData.nidn = nidn
    }
    if (role === 'MAHASISWA' || user.role === 'MAHASISWA') {
      if (nim !== undefined) updateData.nim = nim
      if (jurusan !== undefined) updateData.jurusan = jurusan
      if (semester !== undefined) updateData.semester = semester ? Number(semester) : null
      if (angkatan !== undefined) updateData.angkatan = angkatan ? Number(angkatan) : null
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        nim: true,
        nidn: true,
        jurusan: true,
        semester: true,
        angkatan: true,
        expertise: true,
        isActive: true,
        createdAt: true,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      oldValue: { fullName: user.fullName, role: user.role, isActive: user.isActive },
      newValue: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
