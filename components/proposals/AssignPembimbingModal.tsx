'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { UserCheck, Loader2 } from 'lucide-react'

interface Dosen {
  id: string
  fullName: string
  nidn?: string | null
  expertise?: string | null
}

interface Props {
  proposalId: string
  currentPembimbingId?: string | null
}

export default function AssignPembimbingModal({ proposalId, currentPembimbingId }: Props) {
  const [open, setOpen] = useState(false)
  const [dosenList, setDosenList] = useState<Dosen[]>([])
  const [selectedId, setSelectedId] = useState<string>(currentPembimbingId || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetch('/api/users?role=DOSEN&limit=100')
        .then((r) => r.json())
        .then((d) => setDosenList(d.data || []))
        .catch(console.error)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedId) {
      toast.error('Pilih dosen pembimbing terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pembimbing', pembimbingId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Dosen pembimbing berhasil ditugaskan')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menugaskan pembimbing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className={cn(buttonVariants({ variant: 'gradient' }), 'w-full')}>
            <UserCheck className="w-4 h-4 mr-2" />
            Tugaskan Pembimbing
          </button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wbi-teal/10 text-wbi-teal-dark">
            <UserCheck className="h-4 w-4" />
          </span>
          <DialogTitle>Tugaskan Dosen Pembimbing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Pilih dosen yang akan menjadi pembimbing Tugas Akhir mahasiswa ini.
          </p>
          <Select value={selectedId} onValueChange={(v) => setSelectedId((v as string) || '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Dosen Pembimbing" />
            </SelectTrigger>
            <SelectContent>
              {dosenList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.fullName}{d.nidn ? ` — ${d.nidn}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedId && (
            <div className="bg-wbi-teal/5 border border-wbi-teal/20 rounded-xl p-3 text-sm">
              {dosenList.find((d) => d.id === selectedId)?.expertise && (
                <p className="text-gray-600">
                  Keahlian: {dosenList.find((d) => d.id === selectedId)?.expertise}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !selectedId}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Konfirmasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
