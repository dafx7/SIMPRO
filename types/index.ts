export type Role = 'ADMIN' | 'DOSEN' | 'MAHASISWA'

export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION'
  | 'APPROVED'
  | 'REJECTED'

export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED'

export type ReviewRecommendation = 'APPROVE' | 'REVISE' | 'REJECT'

export type NotificationType =
  | 'STATUS_CHANGE'
  | 'DEADLINE_REMINDER'
  | 'ASSIGNMENT'
  | 'REVIEW_SUBMITTED'
  | 'DECISION_MADE'

export interface UserSession {
  id: string
  email: string
  fullName: string
  role: Role
  nim?: string | null
  jurusan?: string | null
  image?: string | null
}

export interface ProposalWithDetails {
  id: string
  title: string
  abstract: string
  jurusan: string
  status: ProposalStatus
  documentPath?: string | null
  documentName?: string | null
  submitterId: string
  pembimbingId?: string | null
  submissionDate?: Date | null
  reviewDeadline?: Date | null
  similarityScore?: number | null
  similarityFlag: boolean
  adminNotes?: string | null
  createdAt: Date
  updatedAt: Date
  submitter: {
    id: string
    fullName: string
    email: string
    nim?: string | null
    jurusan?: string | null
    semester?: number | null
    angkatan?: number | null
  }
  pembimbing?: {
    id: string
    fullName: string
    email: string
    nidn?: string | null
    expertise?: string | null
  } | null
  assignments: AssignmentWithReview[]
  statusHistory: StatusHistoryEntry[]
}

export interface AssignmentWithReview {
  id: string
  proposalId: string
  pengujiId: string
  assignedAt: Date
  status: AssignmentStatus
  penguji: {
    id: string
    fullName: string
    email: string
    nidn?: string | null
    expertise?: string | null
  }
  reviewForm?: ReviewFormData | null
}

export interface ReviewFormData {
  id: string
  assignmentId: string
  originalityScore: number
  methodologyScore: number
  feasibilityScore: number
  relevanceScore: number
  comments: string
  recommendation: ReviewRecommendation
  submittedAt: Date
}

export interface StatusHistoryEntry {
  id: string
  proposalId: string
  fromStatus?: ProposalStatus | null
  toStatus: ProposalStatus
  changedBy: string
  notes?: string | null
  createdAt: Date
}

export interface NotificationData {
  id: string
  receiverId: string
  senderId?: string | null
  proposalId?: string | null
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  sender?: { fullName: string; email: string } | null
  proposal?: { title: string } | null
}

export interface DashboardStats {
  total: number
  approved: number
  underReview: number
  revision: number
  rejected: number
  submitted: number
  draft: number
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  status?: ProposalStatus
  role?: Role
  jurusan?: string
  startDate?: string
  endDate?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
