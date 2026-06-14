import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProposalForm from '@/components/proposals/ProposalForm'

export default async function NewProposalPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'MAHASISWA') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajukan Proposal Tugas Akhir</h1>
        <p className="text-gray-500 mt-1">Isi formulir berikut untuk mengajukan proposal TA</p>
      </div>
      <ProposalForm />
    </div>
  )
}
