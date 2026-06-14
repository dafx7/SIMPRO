import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthlyBarChart, StatusPieChart, FieldBarChart } from '@/components/dashboard/ProposalChart'
import StatsCard from '@/components/dashboard/StatsCard'
import StatusBadge from '@/components/proposals/StatusBadge'
import { ProposalStatus } from '@/types'
import Link from 'next/link'
import { FileText, CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')
  redirect('/admin/proposals')
}
