import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Endpoint ini sudah tidak digunakan. Gunakan /api/jurusan' }, { status: 410 })
}
