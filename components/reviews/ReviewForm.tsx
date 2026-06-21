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
import { Info, Loader2, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  assignmentId: string
}

// ─── Rubric data ─────────────────────────────────────────────────────────────

type RubricRow = { score: number; label: string; desc: string }

const rubric: Record<string, { rows: RubricRow[] }> = {
  originalityScore: {
    rows: [
      { score: 5, label: 'Sangat Orisinal', desc: 'Topik benar-benar baru, belum pernah diteliti sebelumnya di institusi maupun literatur yang tersedia. Kontribusi ilmiah sangat jelas dan signifikan.' },
      { score: 4, label: 'Orisinal', desc: 'Topik memiliki kebaruan yang jelas, meskipun ada penelitian sejenis. Memberikan sudut pandang atau pendekatan baru yang membedakannya dari karya sebelumnya.' },
      { score: 3, label: 'Cukup Orisinal', desc: 'Topik merupakan pengembangan dari penelitian yang sudah ada dengan modifikasi yang cukup berarti. Kontribusi ada namun tidak terlalu menonjol.' },
      { score: 2, label: 'Kurang Orisinal', desc: 'Topik sangat mirip dengan penelitian yang sudah ada. Hanya ada sedikit perbedaan yang tidak signifikan dari karya sebelumnya.' },
      { score: 1, label: 'Tidak Orisinal', desc: 'Topik merupakan duplikasi atau pengulangan penelitian yang sudah ada tanpa kontribusi kebaruan sama sekali.' },
    ],
  },
  methodologyScore: {
    rows: [
      { score: 5, label: 'Sangat Baik', desc: 'Metodologi sangat tepat, rinci, dan sistematis. Pemilihan metode sepenuhnya sesuai dengan tujuan penelitian. Langkah-langkah penelitian dijelaskan dengan sangat jelas dan dapat direplikasi.' },
      { score: 4, label: 'Baik', desc: 'Metodologi tepat dan cukup rinci. Pemilihan metode sesuai dengan tujuan. Ada sedikit bagian yang perlu diperjelas namun tidak mengurangi kualitas secara signifikan.' },
      { score: 3, label: 'Cukup', desc: 'Metodologi cukup sesuai namun kurang rinci di beberapa bagian. Pemilihan metode dapat diterima meskipun ada alternatif yang lebih tepat.' },
      { score: 2, label: 'Kurang', desc: 'Metodologi kurang sesuai dengan tujuan penelitian atau terdapat kelemahan mendasar dalam rancangan penelitian yang perlu diperbaiki.' },
      { score: 1, label: 'Sangat Kurang', desc: 'Metodologi tidak sesuai, tidak jelas, atau tidak dapat digunakan untuk menjawab rumusan masalah yang diajukan.' },
    ],
  },
  feasibilityScore: {
    rows: [
      { score: 5, label: 'Sangat Layak', desc: 'Proposal dapat dilaksanakan sepenuhnya dalam waktu, anggaran, dan sumber daya yang tersedia. Risiko pelaksanaan sangat rendah.' },
      { score: 4, label: 'Layak', desc: 'Proposal dapat dilaksanakan dengan sumber daya yang ada. Ada sedikit tantangan namun dapat diatasi tanpa perubahan signifikan pada rencana.' },
      { score: 3, label: 'Cukup Layak', desc: 'Proposal dapat dilaksanakan namun memerlukan penyesuaian pada beberapa aspek seperti timeline, sumber data, atau anggaran.' },
      { score: 2, label: 'Kurang Layak', desc: 'Proposal menghadapi kendala cukup serius dalam pelaksanaan. Diperlukan revisi substansial agar dapat dijalankan secara realistis.' },
      { score: 1, label: 'Tidak Layak', desc: 'Proposal tidak dapat dilaksanakan dengan sumber daya, waktu, atau akses yang tersedia saat ini.' },
    ],
  },
  relevanceScore: {
    rows: [
      { score: 5, label: 'Sangat Relevan', desc: 'Topik sangat sesuai dengan bidang keilmuan jurusan dan kebutuhan industri/masyarakat saat ini. Dampak penelitian sangat jelas dan signifikan.' },
      { score: 4, label: 'Relevan', desc: 'Topik sesuai dengan bidang keilmuan jurusan. Ada keterkaitan yang jelas dengan kebutuhan industri atau perkembangan ilmu pengetahuan terkini.' },
      { score: 3, label: 'Cukup Relevan', desc: 'Topik cukup sesuai dengan jurusan meskipun keterkaitan dengan kebutuhan industri atau perkembangan terkini kurang ditonjolkan.' },
      { score: 2, label: 'Kurang Relevan', desc: 'Topik kurang sesuai dengan bidang keilmuan jurusan atau tidak menunjukkan keterkaitan yang jelas dengan kebutuhan saat ini.' },
      { score: 1, label: 'Tidak Relevan', desc: 'Topik tidak sesuai dengan bidang keilmuan jurusan dan tidak memiliki keterkaitan dengan kebutuhan industri maupun perkembangan ilmu pengetahuan.' },
    ],
  },
}

// ─── Criteria config ──────────────────────────────────────────────────────────

const criteria = [
  { key: 'originalityScore' as const, label: 'Orisinalitas', description: 'Kebaruan dan inovasi penelitian' },
  { key: 'methodologyScore' as const, label: 'Metodologi', description: 'Kesesuaian dan kejelasan metode penelitian' },
  { key: 'feasibilityScore' as const, label: 'Kelayakan', description: 'Feasibilitas pelaksanaan penelitian' },
  { key: 'relevanceScore' as const, label: 'Relevansi', description: 'Relevansi dengan bidang penelitian' },
]

// ─── RubricPanel ─────────────────────────────────────────────────────────────

function RubricPanel({ criteriaKey, onClose }: { criteriaKey: string; onClose: () => void }) {
  const rows = rubric[criteriaKey]?.rows ?? []
  return (
    <div className="mt-2 rounded-xl border border-wbi-teal/20 bg-wbi-cream overflow-hidden text-xs shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between bg-wbi-teal/10 px-3 py-2 border-b border-wbi-teal/15">
        <span className="font-semibold text-wbi-forest uppercase tracking-wide text-[10px]">Panduan Penilaian</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Rows */}
      <div className="divide-y divide-wbi-teal/10">
        {rows.map((row) => (
          <div key={row.score} className="flex gap-3 px-3 py-2.5 hover:bg-white/60 transition-colors">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-wbi-teal/15 text-wbi-teal-dark font-bold shrink-0 text-[11px] mt-0.5">
              {row.score}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-wbi-forest">{row.label}</p>
              <p className="text-gray-500 leading-relaxed mt-0.5">{row.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
    </div>
  )
}

// ─── ScoreSummaryCard ─────────────────────────────────────────────────────────

type ScoreValues = { originalityScore: number; methodologyScore: number; feasibilityScore: number; relevanceScore: number }

function ScoreSummaryCard({ scores }: { scores: Partial<ScoreValues> & Record<string, unknown> }) {
  const filled = criteria.filter((c) => ((scores[c.key] as number) ?? 0) > 0)
  if (filled.length === 0) return null

  const total = criteria.reduce((sum, c) => sum + ((scores[c.key] as number) ?? 0), 0)
  const allFilled = filled.length === criteria.length
  const avg = allFilled ? total / 4 : total / filled.length

  const verdict =
    avg >= 4.0
      ? { label: 'Kemungkinan Disetujui', className: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' }
      : avg >= 2.5
      ? { label: 'Kemungkinan Perlu Revisi', className: 'bg-wbi-gold/10 border-wbi-gold/30 text-wbi-gold-dark', dot: 'bg-wbi-gold' }
      : { label: 'Kemungkinan Ditolak', className: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500' }

  return (
    <div className="rounded-xl border border-wbi-teal/15 bg-wbi-cream overflow-hidden">
      {/* Header */}
      <div className="bg-wbi-teal/8 border-b border-wbi-teal/15 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-wbi-forest uppercase tracking-wide">Ringkasan Penilaian</span>
        {allFilled && (
          <span className="text-xs text-wbi-teal-dark font-medium">
            Rata-rata: <strong className="text-wbi-teal-dark">{avg.toFixed(1)}</strong>/5
          </span>
        )}
      </div>

      {/* Score rows */}
      <div className="divide-y divide-wbi-teal/8">
        {criteria.map((c) => {
          const val = (scores[c.key] as number) ?? 0
          const row = rubric[c.key]?.rows.find((r) => r.score === val)
          return (
            <div key={c.key} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-600">{c.label}</span>
              {val > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn('w-3.5 h-3.5', s <= val ? 'fill-wbi-gold text-wbi-gold' : 'text-gray-200')}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-wbi-teal-dark whitespace-nowrap">
                    {val} — {row?.label}
                  </span>
                </div>
              ) : (
                <span className="text-gray-300 italic text-xs">Belum diisi</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Verdict banner */}
      {allFilled && (
        <div className={cn('mx-3 mb-3 mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium', verdict.className)}>
          <span className={cn('h-2 w-2 rounded-full shrink-0', verdict.dot)} />
          {verdict.label}
          <span className="ml-auto font-bold">{avg.toFixed(2)}/5</span>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReviewForm({ assignmentId }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openRubric, setOpenRubric] = useState<string | null>(null)
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
  const commentsValue = watch('comments', '')

  function toggleRubric(key: string) {
    setOpenRubric((prev) => (prev === key ? null : key))
  }

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
    } catch {
      toast.error('Gagal mengirim review. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── Criteria scoring ── */}
      <div className="space-y-5">
        {criteria.map((c) => {
          const val = scores[c.key] ?? 0
          const scoreRow = rubric[c.key]?.rows.find((r) => r.score === val)
          const isRubricOpen = openRubric === c.key

          return (
            <div key={c.key} className="space-y-2">
              {/* Label row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Label className="cursor-default">{c.label}</Label>
                    <button
                      type="button"
                      onClick={() => toggleRubric(c.key)}
                      title={isRubricOpen ? 'Tutup rubrik' : 'Lihat panduan penilaian'}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                        isRubricOpen
                          ? 'bg-wbi-teal/15 text-wbi-teal-dark'
                          : 'text-gray-400 hover:text-wbi-teal hover:bg-wbi-teal/10'
                      )}
                    >
                      <Info className="w-3 h-3" />
                      <span>Rubrik</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                </div>

                {/* Live score label */}
                <div className="shrink-0 text-right">
                  {val > 0 ? (
                    <span className="text-sm font-semibold text-wbi-teal-dark">
                      {val} — {scoreRow?.label}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300 italic">Pilih skor...</span>
                  )}
                </div>
              </div>

              {/* Expandable rubric panel */}
              {isRubricOpen && (
                <RubricPanel criteriaKey={c.key} onClose={() => setOpenRubric(null)} />
              )}

              {/* Star rating */}
              <StarRating
                value={val}
                onChange={(v) => setValue(c.key, v)}
              />

              {errors[c.key] && (
                <p className="text-sm text-red-500">Nilai wajib diisi (1-5)</p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Score summary card ── */}
      <ScoreSummaryCard scores={scores} />

      {/* ── Comments ── */}
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

      {/* ── Recommendation ── */}
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

      <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
        ) : (
          'Kirim Review'
        )}
      </Button>
    </form>
  )
}
