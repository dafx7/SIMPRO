import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createAuditLog } from '@/lib/audit'
import { sendEmail } from '@/lib/email'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nim: { contains: search, mode: 'insensitive' } },
        { nidn: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) where.role = role

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { fullName, email, role, expertise, nidn, nim, jurusan, semester, angkatan } = body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    const tempPassword = generatePassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const createData: Record<string, unknown> = {
      fullName,
      email,
      passwordHash,
      role,
    }

    if (role === 'DOSEN') {
      if (nidn) createData.nidn = nidn
      if (expertise) createData.expertise = expertise
    } else if (role === 'MAHASISWA') {
      if (nim) createData.nim = nim
      if (jurusan) createData.jurusan = jurusan
      if (semester) createData.semester = Number(semester)
      if (angkatan) createData.angkatan = Number(angkatan)
    }

    const user = await prisma.user.create({
      data: createData as Parameters<typeof prisma.user.create>[0]['data'],
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

    await sendEmail(
      email,
      'Selamat Datang di SIMPRO - Akun Anda Telah Dibuat',
      'Akun SIMPRO Anda Telah Dibuat',
      `Halo <strong>${fullName}</strong>,<br><br>Akun Anda di sistem SIMPRO telah dibuat dengan detail berikut:<br><br>Email: <strong>${email}</strong><br>Password sementara: <strong>${tempPassword}</strong><br><br>Harap segera ganti password Anda setelah login.`,
      '/login',
      'Masuk ke SIMPRO'
    )

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      newValue: { fullName, email, role },
    })

    return NextResponse.json({ data: user, tempPassword }, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
