import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProposalTable from '@/components/proposals/ProposalTable'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'

export default async function ProposalsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role

  if (role === 'ADMIN') redirect('/admin/proposals')

  const isMahasiswa = role === 'MAHASISWA'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <WelcomeBanner
            title={isMahasiswa ? 'Proposal TA Saya' : 'Proposal Bimbingan & Pengujian'}
            subtitle={
              isMahasiswa
                ? 'Daftar proposal Tugas Akhir yang telah Anda ajukan'
                : 'Daftar proposal TA yang Anda bimbing atau uji'
            }
          />
        </div>
      </div>
      {isMahasiswa && (
        <div className="flex justify-end">
          <Link href="/proposals/new">
            <Button variant="gradient">
              <PlusCircle className="mr-2 h-4 w-4" />
              Proposal Baru
            </Button>
          </Link>
        </div>
      )}
      <ProposalTable />
    </div>
  )
}
