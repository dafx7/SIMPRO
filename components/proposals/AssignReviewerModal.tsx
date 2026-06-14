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
import { Loader2, UserPlus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface Reviewer {
  id: string
  fullName: string
  email: string
  expertise?: string | null
}

interface AssignReviewerModalProps {
  proposalId: string
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

export default function AssignReviewerModal({ proposalId }: AssignReviewerModalProps) {
  const [open, setOpen] = useState(false)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setIsFetching(true)
      fetch('/api/users?role=REVIEWER&limit=50')
        .then((r) => r.json())
        .then((d) => setReviewers(d.data?.filter((u: Reviewer & { isActive: boolean }) => u.isActive) || []))
        .catch(console.error)
        .finally(() => setIsFetching(false))
    }
  }, [open])

  const toggleReviewer = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selected.length < 2) {
      toast.error('Pilih minimal 2 reviewer')
      return
    }
    if (!deadline) {
      toast.error('Batas waktu review harus diisi')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerIds: selected, reviewDeadline: deadline }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Reviewer berhasil ditugaskan!')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Gagal menugaskan reviewer')
    } finally {
      setIsLoading(false)
    }
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full bg-blue-800 hover:bg-blue-900 text-white inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 cursor-pointer transition-colors hover:bg-blue-900">
        <UserPlus className="mr-2 h-4 w-4" />
        Tugaskan Reviewer
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tugaskan Reviewer</DialogTitle>
          <DialogDescription>
            Pilih minimal 2 reviewer untuk mengevaluasi proposal ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Reviewer Tersedia ({selected.length} dipilih)
            </Label>
            {isFetching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {reviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleReviewer(reviewer.id)}
                  >
                    <CheckboxItem
                      id={reviewer.id}
                      checked={selected.includes(reviewer.id)}
                      onCheckedChange={() => toggleReviewer(reviewer.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{reviewer.fullName}</p>
                      {reviewer.expertise && (
                        <p className="text-xs text-gray-400">{reviewer.expertise}</p>
                      )}
                    </div>
                  </div>
                ))}
                {reviewers.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Tidak ada reviewer tersedia</p>
                )}
              </div>
            )}
            {selected.length < 2 && selected.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">Pilih minimal 2 reviewer</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Batas Waktu Review *</Label>
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
            className="bg-blue-800 hover:bg-blue-900"
            onClick={handleSubmit}
            disabled={isLoading || selected.length < 2 || !deadline}
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
