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
import { Loader2, Users } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface Dosen {
  id: string
  fullName: string
  email: string
  nidn?: string | null
  expertise?: string | null
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

export default function AssignPengujiModal({ proposalId, currentPengujiIds = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [dosenList, setDosenList] = useState<Dosen[]>([])
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
    }
  }, [open])

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full bg-amber-600 hover:bg-amber-700 text-white inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 cursor-pointer transition-colors">
        <Users className="mr-2 h-4 w-4" />
        Tugaskan Penguji
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tugaskan Dosen Penguji</DialogTitle>
          <DialogDescription>
            Pilih dosen yang akan menguji proposal Tugas Akhir ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Dosen Tersedia ({selected.length} dipilih)
            </Label>
            {isFetching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {dosenList.map((dosen) => (
                  <div
                    key={dosen.id}
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
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
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
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
