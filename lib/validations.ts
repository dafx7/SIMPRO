import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const proposalStep1Schema = z.object({
  title: z.string().min(10, 'Judul minimal 10 karakter').max(255, 'Judul maksimal 255 karakter'),
  abstract: z.string().min(100, 'Abstrak minimal 100 karakter'),
})

export const reviewFormSchema = z.object({
  originalityScore: z.number().min(1).max(5),
  methodologyScore: z.number().min(1).max(5),
  feasibilityScore: z.number().min(1).max(5),
  relevanceScore: z.number().min(1).max(5),
  comments: z.string().min(50, 'Komentar minimal 50 karakter'),
  recommendation: z.enum(['APPROVE', 'REVISE', 'REJECT']),
})

export const assignPembimbingSchema = z.object({
  pembimbingId: z.string().min(1, 'Pembimbing wajib dipilih'),
})

export const assignPengujiSchema = z.object({
  pengujiIds: z.array(z.string()).min(1, 'Minimal 1 penguji harus dipilih'),
  reviewDeadline: z.string().min(1, 'Batas waktu ujian wajib diisi'),
})

export const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REVISION', 'REJECTED']),
  adminNotes: z.string().optional(),
}).refine((data) => {
  if (data.decision === 'REVISION' || data.decision === 'REJECTED') {
    return data.adminNotes && data.adminNotes.length > 0
  }
  return true
}, {
  message: 'Catatan wajib diisi untuk keputusan Revisi atau Ditolak',
  path: ['adminNotes'],
})

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  role: z.enum(['DOSEN', 'MAHASISWA', 'ADMIN']),
  // DOSEN fields
  nidn: z.string().optional(),
  expertise: z.string().optional(),
  // MAHASISWA fields
  nim: z.string().optional(),
  jurusan: z.string().optional(),
  semester: z.number().optional(),
  angkatan: z.number().optional(),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['DOSEN', 'MAHASISWA', 'ADMIN']).optional(),
  expertise: z.string().optional(),
  nidn: z.string().optional(),
  nim: z.string().optional(),
  jurusan: z.string().optional(),
  semester: z.number().optional(),
  angkatan: z.number().optional(),
  isActive: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ProposalStep1Input = z.infer<typeof proposalStep1Schema>
export type ReviewFormInput = z.infer<typeof reviewFormSchema>
export type AssignPembimbingInput = z.infer<typeof assignPembimbingSchema>
export type AssignPengujiInput = z.infer<typeof assignPengujiSchema>
export type DecisionInput = z.infer<typeof decisionSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
