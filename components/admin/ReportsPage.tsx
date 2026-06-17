'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { MonthlyBarChart, StatusPieChart, FieldBarChart } from '@/components/dashboard/ProposalChart'
import StatusBadge from '@/components/proposals/StatusBadge'
import { ProposalStatus } from '@/types'
import { Download, FileText, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ReportData {
  proposals: Array<{
    id: string
    title: string
    jurusan: string
    status: string
    createdAt: string
    submissionDate?: string
    submitter: { fullName: string; email: string; nim?: string | null }
    pembimbing?: { fullName: string } | null
    assignments: Array<{
      penguji: { fullName: string }
      reviewForm?: {
        originalityScore: number
        methodologyScore: number
        feasibilityScore: number
        relevanceScore: number
        recommendation: string
      } | null
    }>
  }>
  summary: {
    total: number
    byStatus: Record<string, number>
    byField: Array<{ field: string; count: number }>
    monthly: Array<{ month: string; count: number }>
  }
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  createdAt: string
  user: { fullName: string; email: string }
  proposal?: { title: string } | null
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
  DRAFT: '#94A3B8',
  SUBMITTED: '#4D8C85',
  UNDER_REVIEW: '#BD8527',
  REVISION: '#EA8C3A',
  APPROVED: '#2D9D6F',
  REJECTED: '#DC4545',
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [auditData, setAuditData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      setReportData(data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const fetchAudit = useCallback(async () => {
    setAuditLoading(true)
    try {
      const res = await fetch('/api/reports?type=audit')
      const data = await res.json()
      setAuditData(data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setAuditLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const exportToExcel = () => {
    if (!reportData) return
    setExporting(true)
    try {
      const rows = reportData.proposals.map((p) => ({
        'Judul Proposal TA': p.title,
        Mahasiswa: p.submitter.fullName,
        NIM: p.submitter.nim || '-',
        'Email Mahasiswa': p.submitter.email,
        Jurusan: p.jurusan,
        'Dosen Pembimbing': p.pembimbing?.fullName || '-',
        Status: statusLabels[p.status] || p.status,
        'Tanggal Dibuat': format(new Date(p.createdAt), 'd MMMM yyyy', { locale: idLocale }),
        'Tanggal Submit': p.submissionDate
          ? format(new Date(p.submissionDate), 'd MMMM yyyy', { locale: idLocale })
          : '-',
        'Jumlah Penguji': p.assignments.length,
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Proposal')

      const summaryRows = [
        { Metrik: 'Total Proposal', Nilai: reportData.summary.total },
        ...Object.entries(reportData.summary.byStatus).map(([status, count]) => ({
          Metrik: `Status: ${statusLabels[status] || status}`,
          Nilai: count,
        })),
      ]
      const ws2 = XLSX.utils.json_to_sheet(summaryRows)
      XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan')

      XLSX.writeFile(wb, `laporan-ta-simpro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportData) return
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Laporan Proposal Tugas Akhir', 14, 20)
      doc.setFontSize(11)
      doc.text(`SIMPRO - Politeknik Wilmar Bisnis Indonesia`, 14, 28)
      doc.text(`Dicetak: ${format(new Date(), 'd MMMM yyyy', { locale: idLocale })}`, 14, 34)

      doc.setFontSize(13)
      doc.text('Ringkasan', 14, 46)
      autoTable(doc, {
        startY: 50,
        head: [['Metrik', 'Nilai']],
        body: [
          ['Total Proposal', String(reportData.summary.total)],
          ...Object.entries(reportData.summary.byStatus).map(([status, count]) => [
            statusLabels[status] || status,
            String(count),
          ]),
        ],
        theme: 'striped',
        styles: { fontSize: 10 },
      })

      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 100

      doc.setFontSize(13)
      doc.text('Daftar Proposal', 14, finalY + 12)
      autoTable(doc, {
        startY: finalY + 16,
        head: [['Judul', 'Mahasiswa', 'Jurusan', 'Pembimbing', 'Status']],
        body: reportData.proposals.map((p) => [
          p.title.substring(0, 40) + (p.title.length > 40 ? '...' : ''),
          `${p.submitter.fullName}${p.submitter.nim ? ` (${p.submitter.nim})` : ''}`,
          p.jurusan,
          p.pembimbing?.fullName || '-',
          statusLabels[p.status] || p.status,
        ]),
        theme: 'striped',
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 70 } },
      })

      doc.save(`laporan-ta-simpro-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  const statusChartData = reportData
    ? Object.entries(reportData.summary.byStatus).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || '#9ca3af',
      }))
    : []

  return (
    <Tabs defaultValue="summary" onValueChange={(v) => v === 'audit' && fetchAudit()}>
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="proposals">Daftar Proposal</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={exporting || !reportData}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} disabled={exporting || !reportData}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
            PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 p-4 bg-wbi-cream rounded-2xl">
        <div>
          <Label className="text-xs">Dari Tanggal</Label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block border border-input rounded-xl px-2 py-1 text-sm mt-1 focus:outline-none focus:ring-3 focus:ring-wbi-teal/30 focus:border-wbi-teal"
          />
        </div>
        <div>
          <Label className="text-xs">Sampai Tanggal</Label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block border border-input rounded-xl px-2 py-1 text-sm mt-1 focus:outline-none focus:ring-3 focus:ring-wbi-teal/30 focus:border-wbi-teal"
          />
        </div>
        <div className="flex items-end">
          <Button size="sm" variant="gradient" onClick={fetchReport}>
            Filter
          </Button>
        </div>
        {(startDate || endDate) && (
          <div className="flex items-end">
            <Button size="sm" variant="outline" onClick={() => { setStartDate(''); setEndDate('') }}>
              Reset
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="summary">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold font-heading text-wbi-forest">{reportData.summary.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Proposal</p>
                </CardContent>
              </Card>
              {Object.entries(reportData.summary.byStatus).slice(0, 3).map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold" style={{ color: statusColors[status] }}>{count}</p>
                    <p className="text-xs text-gray-500 mt-1">{statusLabels[status] || status}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Proposal per Bulan (6 Bulan Terakhir)</CardTitle></CardHeader>
                <CardContent>
                  <MonthlyBarChart data={reportData.summary.monthly} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Distribusi Status</CardTitle></CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <StatusPieChart data={statusChartData} />
                  ) : (
                    <p className="text-center text-gray-400 py-10">Tidak ada data</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-sm">Proposal TA per Jurusan</CardTitle></CardHeader>
              <CardContent>
                <FieldBarChart data={reportData.summary.byField} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="proposals">
        {loading ? (
          <Skeleton className="h-96" />
        ) : reportData ? (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600">Judul Proposal TA</th>
                  <th className="text-left p-3 font-medium text-gray-600">Mahasiswa</th>
                  <th className="text-left p-3 font-medium text-gray-600">Jurusan</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {reportData.proposals.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 max-w-xs">
                      <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                    </td>
                    <td className="p-3 text-gray-600">
                      <p>{p.submitter.fullName}</p>
                      {p.submitter.nim && <p className="text-xs text-gray-400">{p.submitter.nim}</p>}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{p.jurusan}</td>
                    <td className="p-3">
                      <StatusBadge status={p.status as ProposalStatus} size="sm" />
                    </td>
                    <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(p.createdAt), 'd MMM yyyy', { locale: idLocale })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="audit">
        {auditLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600">Aksi</th>
                  <th className="text-left p-3 font-medium text-gray-600">Pengguna</th>
                  <th className="text-left p-3 font-medium text-gray-600">Entitas</th>
                  <th className="text-left p-3 font-medium text-gray-600">Proposal</th>
                  <th className="text-left p-3 font-medium text-gray-600">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {auditData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">Belum ada audit log</td>
                  </tr>
                ) : (
                  auditData.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{log.action}</span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{log.user.fullName}</p>
                        <p className="text-xs text-gray-400">{log.user.email}</p>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">{log.entityType}</td>
                      <td className="p-3 text-gray-500 text-xs max-w-xs">
                        <p className="line-clamp-2">{log.proposal?.title || '-'}</p>
                      </td>
                      <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                        {format(new Date(log.createdAt), 'd MMM yyyy HH:mm', { locale: idLocale })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
