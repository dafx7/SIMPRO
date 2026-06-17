import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProposalForm from '@/components/proposals/ProposalForm'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'

export default async function NewProposalPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'MAHASISWA') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <WelcomeBanner title="Ajukan Proposal Tugas Akhir" subtitle="Isi formulir berikut untuk mengajukan proposal TA" />
      <ProposalForm />
    </div>
  )
}
