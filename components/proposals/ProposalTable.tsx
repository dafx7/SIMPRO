'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from './StatusBadge'
import { ProposalStatus } from '@/types'

interface Proposal {
  id: string
  title: string
  jurusan: string
  status: ProposalStatus
  createdAt: string
  submissionDate?: string | null
  submitter?: { fullName: string; nim?: string | null }
  pembimbing?: { fullName: string } | null
}

interface ProposalTableProps {
  showSubmitter?: boolean
  baseApiUrl?: string
  linkPrefix?: string
}

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Diajukan' },
  { value: 'UNDER_REVIEW', label: 'Dalam Penilaian' },
  { value: 'REVISION', label: 'Perlu Revisi' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
]

export default function ProposalTable({
  showSubmitter = false,
  baseApiUrl = '/api/proposals',
  linkPrefix = '/proposals',
}: ProposalTableProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && status !== 'all' && { status }),
      })
      const res = await fetch(`${baseApiUrl}?${params}`)
      const data = await res.json()
      setProposals(data.data || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, baseApiUrl])

  useEffect(() => {
    const timer = setTimeout(fetchProposals, 300)
    return () => clearTimeout(timer)
  }, [fetchProposals])

  useEffect(() => {
    setPage(1)
  }, [search, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={showSubmitter ? 'Cari judul, nama, atau NIM...' : 'Cari judul proposal...'}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">{total} proposal ditemukan</div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-wbi-cream">
              <th className="text-left p-3 font-semibold text-wbi-olive">Judul Proposal TA</th>
              {showSubmitter && (
                <th className="text-left p-3 font-semibold text-wbi-olive">Mahasiswa</th>
              )}
              <th className="text-left p-3 font-semibold text-wbi-olive">Jurusan</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Tanggal</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                  {showSubmitter && <td className="p-3"><Skeleton className="h-4 w-24" /></td>}
                  <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-6 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-8 w-16" /></td>
                </tr>
              ))
            ) : proposals.length === 0 ? (
              <tr>
                <td colSpan={showSubmitter ? 6 : 5} className="p-12 text-center">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-muted-foreground">Tidak ada proposal ditemukan</p>
                </td>
              </tr>
            ) : (
              proposals.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-wbi-teal/5 transition-colors">
                  <td className="p-3">
                    <p className="font-medium line-clamp-2 max-w-xs">{p.title}</p>
                  </td>
                  {showSubmitter && (
                    <td className="p-3 text-muted-foreground">
                      <p>{p.submitter?.fullName}</p>
                      {p.submitter?.nim && (
                        <p className="text-xs text-gray-400">{p.submitter.nim}</p>
                      )}
                    </td>
                  )}
                  <td className="p-3 text-muted-foreground text-xs">{p.jurusan}</td>
                  <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                    {format(new Date(p.submissionDate || p.createdAt), 'd MMM yyyy', { locale: id })}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="p-3">
                    <Link href={`${linkPrefix}/${p.id}`}>
                      <Button variant="outline" size="sm">
                        Lihat
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
