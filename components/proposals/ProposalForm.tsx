'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { proposalStep1Schema, ProposalStep1Input } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, Upload, FileText, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'

const STEPS = ['Info Dasar', 'Upload Dokumen', 'Konfirmasi']

export default function ProposalForm() {
  const [step, setStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProposalStep1Input>({
    resolver: zodResolver(proposalStep1Schema),
  })

  const abstractValue = watch('abstract', '')

  const handleFileUpload = useCallback(async (file: File) => {
    if (!proposalId) {
      toast.error('Simpan info dasar terlebih dahulu')
      return
    }
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diizinkan')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/proposals/${proposalId}/document`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadedFile(file)
      toast.success('Dokumen berhasil diunggah')
    } catch {
      toast.error('Gagal mengunggah dokumen')
    } finally {
      setIsUploading(false)
    }
  }, [proposalId])

  const onStep1Submit = async (data: ProposalStep1Input) => {
    setIsSubmitting(true)
    try {
      const method = proposalId ? 'PATCH' : 'POST'
      const url = proposalId ? `/api/proposals/${proposalId}` : '/api/proposals'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: 'draft' }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      if (!proposalId) setProposalId(result.data.id)
      setStep(2)
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menyimpan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = async (action: 'draft' | 'submit') => {
    if (!proposalId) return
    setIsSubmitting(true)
    setIsDraft(action === 'draft')

    try {
      if (action === 'submit') {
        const res = await fetch(`/api/proposals/${proposalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Proposal TA berhasil diajukan!')
      } else {
        toast.success('Proposal disimpan sebagai draft')
      }
      router.push('/proposals')
    } catch {
      toast.error('Gagal memproses proposal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formValues = watch()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`font-medium ${step === i + 1 ? 'text-blue-700' : step > i + 1 ? 'text-green-600' : ''}`}
            >
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
            </span>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar Proposal TA</CardTitle>
            <CardDescription>Isi informasi dasar proposal Tugas Akhir Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Proposal TA *</Label>
                <Input
                  id="title"
                  placeholder="Masukkan judul proposal Tugas Akhir"
                  {...register('title')}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="abstract">Abstrak *</Label>
                  <span className={`text-xs ${abstractValue.length >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                    {abstractValue.length} / minimal 100 karakter
                  </span>
                </div>
                <Textarea
                  id="abstract"
                  placeholder="Tuliskan abstrak Tugas Akhir Anda (minimal 100 karakter)"
                  className="min-h-[150px]"
                  {...register('abstract')}
                />
                {errors.abstract && <p className="text-sm text-red-500">{errors.abstract.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <>Lanjutkan <ChevronRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Dokumen Proposal</CardTitle>
            <CardDescription>Upload file PDF proposal (opsional, maksimal 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFileUpload(file)
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm text-gray-500">Mengunggah...</p>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                  <p className="font-medium text-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Seret file ke sini</p>
                  <p className="text-xs text-gray-400 mt-1">atau</p>
                  <label className="mt-2 cursor-pointer text-blue-600 text-sm hover:underline">
                    Pilih file PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">PDF, maksimal 10MB</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
              </Button>
              <Button
                className="flex-1 bg-blue-800 hover:bg-blue-900"
                onClick={() => setStep(3)}
              >
                Lanjutkan <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Konfirmasi Proposal TA</CardTitle>
            <CardDescription>Periksa kembali data proposal Anda sebelum disubmit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Judul</p>
                <p className="font-medium mt-1">{formValues.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Abstrak</p>
                <p className="text-sm text-gray-700 mt-1 line-clamp-4">{formValues.abstract}</p>
              </div>
              {uploadedFile && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Dokumen</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{uploadedFile.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit('draft')}
              >
                {isSubmitting && isDraft ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan sebagai Draft
              </Button>
              <Button
                className="flex-1 bg-blue-800 hover:bg-blue-900"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit('submit')}
              >
                {isSubmitting && !isDraft ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Ajukan Proposal TA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
