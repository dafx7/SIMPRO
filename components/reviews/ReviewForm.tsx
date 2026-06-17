'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { reviewFormSchema, ReviewFormInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  assignmentId: string
}

const criteria = [
  { key: 'originalityScore' as const, label: 'Orisinalitas', description: 'Kebaruan dan inovasi penelitian' },
  { key: 'methodologyScore' as const, label: 'Metodologi', description: 'Kesesuaian dan kejelasan metode penelitian' },
  { key: 'feasibilityScore' as const, label: 'Kelayakan', description: 'Feasibilitas pelaksanaan penelitian' },
  { key: 'relevanceScore' as const, label: 'Relevansi', description: 'Relevansi dengan bidang penelitian' },
]

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'w-7 h-7 transition-all',
              (hovered || value) >= star
                ? 'fill-wbi-gold text-wbi-gold scale-110'
                : 'text-gray-200'
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600 self-center">{value}/5</span>
      )}
    </div>
  )
}

export default function ReviewForm({ assignmentId }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormInput>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      originalityScore: 0,
      methodologyScore: 0,
      feasibilityScore: 0,
      relevanceScore: 0,
    },
  })

  const scores = watch()
  const avgScore =
    criteria.every((c) => scores[c.key] > 0)
      ? (
          (scores.originalityScore +
            scores.methodologyScore +
            scores.feasibilityScore +
            scores.relevanceScore) /
          4
        ).toFixed(1)
      : null

  const commentsValue = watch('comments', '')

  const onSubmit = async (data: ReviewFormInput) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, assignmentId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success('Review berhasil dikirim!')
      router.refresh()
    } catch (error) {
      toast.error('Gagal mengirim review. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {criteria.map((c) => (
          <div key={c.key} className="space-y-2">
            <div>
              <Label>{c.label}</Label>
              <p className="text-xs text-gray-400">{c.description}</p>
            </div>
            <StarRating
              value={scores[c.key] || 0}
              onChange={(v) => setValue(c.key, v)}
            />
            {errors[c.key] && (
              <p className="text-sm text-red-500">Nilai wajib diisi (1-5)</p>
            )}
          </div>
        ))}
      </div>

      {avgScore && (
        <div className="flex items-center gap-3 p-3 bg-wbi-teal/5 border border-wbi-teal/15 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-wbi-teal-dark">{avgScore}</div>
            <div className="text-xs text-wbi-teal-dark/70">Rata-rata</div>
          </div>
          <div className="text-sm text-wbi-forest">Nilai rata-rata dari 4 kriteria penilaian</div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="comments">Komentar & Saran *</Label>
          <span className={`text-xs ${commentsValue.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
            {commentsValue.length} / minimal 50 karakter
          </span>
        </div>
        <Textarea
          id="comments"
          placeholder="Tuliskan komentar dan saran yang membangun untuk proposal ini..."
          className="min-h-[120px]"
          {...register('comments')}
        />
        {errors.comments && <p className="text-sm text-red-500">{errors.comments.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Rekomendasi *</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'APPROVE', label: 'Setujui', color: 'green' },
            { value: 'REVISE', label: 'Perlu Revisi', color: 'amber' },
            { value: 'REJECT', label: 'Tolak', color: 'red' },
          ].map((opt) => {
            const selected = scores.recommendation === opt.value
            return (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer text-sm font-medium transition-all',
                  selected
                    ? opt.color === 'green'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 scale-[1.02]'
                      : opt.color === 'amber'
                      ? 'border-wbi-gold bg-wbi-gold/10 text-wbi-gold-dark scale-[1.02]'
                      : 'border-red-500 bg-red-50 text-red-700 scale-[1.02]'
                    : 'border-gray-200 hover:border-wbi-teal/40'
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={opt.value}
                  {...register('recommendation')}
                />
                {opt.label}
              </label>
            )
          })}
        </div>
        {errors.recommendation && (
          <p className="text-sm text-red-500">Rekomendasi wajib dipilih</p>
        )}
      </div>

      <Button
        type="submit"
        variant="gradient"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
        ) : (
          'Kirim Review'
        )}
      </Button>
    </form>
  )
}
