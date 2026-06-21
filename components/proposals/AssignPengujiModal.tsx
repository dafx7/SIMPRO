'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Users, Sparkles } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface Dosen {
  id: string
  fullName: string
  email: string
  nidn?: string | null
  expertise?: string | null
}

interface Recommendation {
  dosenId: string
  fullName: string
  nidn?: string | null
  expertise?: string | null
  similarityScore: number
  reason: string
}

interface Props {
  proposalId: string
  currentPengujiIds?: string[]
}

function CheckboxItem({ id, checked, onCheckedChange }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
    />
  )
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const circumference = 2 * Math.PI * 14
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="relative h-9 w-9 shrink-0">
      <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--wbi-gold-light)" strokeOpacity="0.25" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="var(--wbi-gold)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-wbi-gold-dark">
        {pct}%
      </span>
    </div>
  )
}

export default function AssignPengujiModal({ proposalId, currentPengujiIds = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [dosenList, setDosenList] = useState<Dosen[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRec, setLoadingRec] = useState(false)
  const [selected, setSelected] = useState<string[]>(currentPengujiIds)
  const [deadline, setDeadline] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setIsFetching(true)
      fetch('/api/users?role=DOSEN&limit=100')
        .then((r) => r.json())
        .then((d) => setDosenList(d.data?.filter((u: Dosen & { isActive: boolean }) => u.isActive) || []))
        .catch(console.error)
        .finally(() => setIsFetching(false))

      setLoadingRec(true)
      fetch('http://localhost:8000/recommend-penguji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, topN: 3 }),
      })
        .then((r) => r.json())
        .then((data) => {
          setRecommendations(data.recommendations || [])
          setLoadingRec(false)
        })
        .catch(() => setLoadingRec(false))
    }
  }, [open, proposalId])

  const toggleDosen = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selected.length < 1) {
      toast.error('Pilih minimal 1 dosen penguji')
      return
    }
    if (!deadline) {
      toast.error('Batas waktu penilaian harus diisi')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'penguji', pengujiIds: selected, reviewDeadline: deadline }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Dosen penguji berhasil ditugaskan!')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menugaskan penguji')
    } finally {
      setIsLoading(false)
    }
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const recommendedIds = new Set(recommendations.map((r) => r.dosenId))
  const restOfDosen = dosenList.filter((d) => !recommendedIds.has(d.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full bg-gradient-to-br from-wbi-gold to-wbi-gold-dark text-white inline-flex items-center justify-center rounded-xl text-sm font-medium h-9 px-4 py-2 cursor-pointer transition-all duration-200 shadow-md shadow-wbi-gold/20 hover:shadow-lg hover:shadow-wbi-gold/30 hover:scale-[1.02]">
        <Users className="mr-2 h-4 w-4" />
        Tugaskan Penguji
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 shrink-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wbi-gold/10 text-wbi-gold-dark">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <DialogTitle>Tugaskan Dosen Penguji</DialogTitle>
            <DialogDescription>
              Pilih dosen yang akan menguji proposal Tugas Akhir ini
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0 pr-1">
          {loadingRec && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Memuat rekomendasi AI...
            </div>
          )}

          {!loadingRec && recommendations.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1.5 text-wbi-gold-dark">
                <Sparkles className="w-3.5 h-3.5" />
                Rekomendasi AI (berdasarkan kemiripan topik)
              </Label>
              <div className="space-y-2 rounded-2xl bg-gradient-to-br from-wbi-gold/10 via-wbi-gold/5 to-transparent p-[1.5px]">
                <div className="space-y-1.5 rounded-[15px] bg-white/60 p-2.5 backdrop-blur-sm">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.dosenId}
                      className="flex items-start gap-3 p-2 rounded-xl hover:bg-wbi-gold/10 cursor-pointer transition-colors"
                      onClick={() => toggleDosen(rec.dosenId)}
                    >
                      <CheckboxItem
                        id={`rec-${rec.dosenId}`}
                        checked={selected.includes(rec.dosenId)}
                        onCheckedChange={() => toggleDosen(rec.dosenId)}
                      />
                      <ScoreRing score={rec.similarityScore} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{rec.fullName}</p>
                        {rec.nidn && <p className="text-xs text-gray-400">NIDN: {rec.nidn}</p>}
                        <p className="text-xs text-gray-500">{rec.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Semua Dosen ({selected.length} dipilih)
            </Label>
            {isFetching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-wbi-teal" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-xl p-3">
                {restOfDosen.map((dosen) => (
                  <div
                    key={dosen.id}
                    className="flex items-start gap-3 p-2 hover:bg-wbi-teal/5 rounded-xl cursor-pointer transition-colors"
                    onClick={() => toggleDosen(dosen.id)}
                  >
                    <CheckboxItem
                      id={dosen.id}
                      checked={selected.includes(dosen.id)}
                      onCheckedChange={() => toggleDosen(dosen.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{dosen.fullName}</p>
                      {dosen.nidn && <p className="text-xs text-gray-400">NIDN: {dosen.nidn}</p>}
                      {dosen.expertise && (
                        <p className="text-xs text-gray-400">{dosen.expertise}</p>
                      )}
                    </div>
                  </div>
                ))}
                {dosenList.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Tidak ada dosen tersedia</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Batas Waktu Penilaian *</Label>
            <input
              id="deadline"
              type="date"
              min={minDateStr}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-3 focus:ring-wbi-teal/30 focus:border-wbi-teal transition-all"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            className="bg-gradient-to-br from-wbi-gold to-wbi-gold-dark text-white hover:shadow-md hover:shadow-wbi-gold/30"
            onClick={handleSubmit}
            disabled={isLoading || selected.length < 1 || !deadline}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
            ) : (
              'Konfirmasi Penugasan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
