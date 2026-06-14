import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const jurusanList = await prisma.jurusan.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: jurusanList })
  } catch (error) {
    console.error('GET /api/jurusan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
