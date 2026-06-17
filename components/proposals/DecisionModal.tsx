'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Gavel, Star } from 'lucide-react'

interface ReviewSummary {
  reviewerName: string
  originalityScore: number
  methodologyScore: number
  feasibilityScore: number
  relevanceScore: number
  recommendation: string
  comments: string
}

interface DecisionModalProps {
  proposalId: string
  reviews: ReviewSummary[]
}

const recommendationLabels: Record<string, string> = {
  APPROVE: 'Setujui',
  REVISE: 'Perlu Revisi',
  REJECT: 'Tolak',
}

export default function DecisionModal({ proposalId, reviews }: DecisionModalProps) {
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const avgByReviewer = reviews.map((r) => ({
    name: r.reviewerName,
    avg: ((r.originalityScore + r.methodologyScore + r.feasibilityScore + r.relevanceScore) / 4).toFixed(1),
    recommendation: r.recommendation,
  }))

  const overallAvg = reviews.length
    ? (
        reviews.reduce(
          (sum, r) =>
            sum + (r.originalityScore + r.methodologyScore + r.feasibilityScore + r.relevanceScore) / 4,
          0
        ) / reviews.length
      ).toFixed(1)
    : '-'

  const handleSubmit = async () => {
    if (!decision) {
      toast.error('Pilih keputusan terlebih dahulu')
      return
    }
    if ((decision === 'REVISION' || decision === 'REJECTED') && !adminNotes.trim()) {
      toast.error('Catatan wajib diisi untuk keputusan revisi atau ditolak')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, adminNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Keputusan berhasil disimpan!')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Gagal menyimpan keputusan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white inline-flex items-center justify-center rounded-xl text-sm font-medium h-9 px-4 py-2 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02]">
        <Gavel className="mr-2 h-4 w-4" />
        Buat Keputusan
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Gavel className="h-4 w-4" />
          </span>
          <div>
            <DialogTitle>Buat Keputusan Proposal</DialogTitle>
            <DialogDescription>
              Tinjau hasil review dan tentukan keputusan akhir untuk proposal ini
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="bg-wbi-teal/5 border border-wbi-teal/15 rounded-2xl p-4">
            <p className="text-sm font-medium text-wbi-forest mb-2">Ringkasan Review</p>
            <div className="space-y-2">
              {avgByReviewer.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-wbi-teal-dark">{r.avg}/5</span>
                    <span className="text-xs px-2 py-0.5 bg-wbi-teal/10 text-wbi-teal-dark rounded-full">
                      {recommendationLabels[r.recommendation] || r.recommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-wbi-teal/20 mt-2 pt-2 flex justify-between text-sm font-bold">
              <span className="text-wbi-forest">Rata-rata Keseluruhan</span>
              <span className="text-wbi-teal-dark">{overallAvg}/5</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keputusan *</Label>
            <Select value={decision} onValueChange={(v) => setDecision(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih keputusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">✅ Setujui</SelectItem>
                <SelectItem value="REVISION">🔄 Minta Revisi</SelectItem>
                <SelectItem value="REJECTED">❌ Tolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">
              Catatan untuk Pengusul
              {(decision === 'REVISION' || decision === 'REJECTED') && (
                <span className="text-red-500"> *</span>
              )}
            </Label>
            <Textarea
              id="adminNotes"
              placeholder={
                decision === 'APPROVED'
                  ? 'Opsional: berikan pesan motivasi atau informasi lebih lanjut'
                  : 'Jelaskan alasan keputusan dan hal-hal yang perlu diperbaiki...'
              }
              className="min-h-[100px]"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            className={`${
              decision === 'APPROVED'
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white'
                : decision === 'REJECTED'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-br from-wbi-forest to-wbi-teal text-white'
            }`}
            onClick={handleSubmit}
            disabled={isLoading || !decision}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
            ) : (
              'Konfirmasi Keputusan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
