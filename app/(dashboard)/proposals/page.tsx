import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProposalTable from '@/components/proposals/ProposalTable'

export default async function ProposalsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role

  if (role === 'ADMIN') redirect('/admin/proposals')

  const isMahasiswa = role === 'MAHASISWA'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isMahasiswa ? 'Proposal TA Saya' : 'Proposal Bimbingan & Pengujian'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isMahasiswa
              ? 'Daftar proposal Tugas Akhir yang telah Anda ajukan'
              : 'Daftar proposal TA yang Anda bimbing atau uji'}
          </p>
        </div>
        {isMahasiswa && (
          <Link href="/proposals/new">
            <Button className="bg-blue-800 hover:bg-blue-900">
              <PlusCircle className="mr-2 h-4 w-4" />
              Proposal Baru
            </Button>
          </Link>
        )}
      </div>
      <ProposalTable />
    </div>
  )
}
