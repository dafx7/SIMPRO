'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthlyBarChart, StatusPieChart, FieldBarChart } from '@/components/dashboard/ProposalChart'
import { Skeleton } from '@/components/ui/skeleton'

interface ReportData {
  summary: {
    byStatus: Record<string, number>
    byField: Array<{ field: string; count: number }>
    monthly: Array<{ month: string; count: number }>
  }
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  UNDER_REVIEW: 'Dalam Penilaian',
  REVISION: 'Perlu Revisi',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
}

const statusColors: Record<string, string> = {
  DRAFT: '#9ca3af',
  SUBMITTED: '#3b82f6',
  UNDER_REVIEW: '#f59e0b',
  REVISION: '#f97316',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
}

export default function AdminDashboardCharts() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (!data) return null

  const statusChartData = Object.entries(data.summary.byStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#9ca3af',
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Proposal TA per Bulan (6 Bulan Terakhir)</CardTitle></CardHeader>
        <CardContent>
          <MonthlyBarChart data={data.summary.monthly} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Distribusi Status</CardTitle></CardHeader>
        <CardContent>
          {statusChartData.length > 0 ? (
            <StatusPieChart data={statusChartData} />
          ) : (
            <p className="text-center text-gray-400 py-10">Belum ada data</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
