import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

export async function createNotification(params: {
  receiverId: string
  senderId?: string
  proposalId?: string
  type: NotificationType
  title: string
  message: string
}): Promise<void> {
  await prisma.notification.create({
    data: {
      receiverId: params.receiverId,
      senderId: params.senderId,
      proposalId: params.proposalId,
      type: params.type,
      title: params.title,
      message: params.message,
    },
  })
}

export async function notifyAdminsProposalSubmitted(
  proposalId: string,
  proposalTitle: string,
  mahasiswaName: string,
  nim: string | null | undefined,
  submitterId: string
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  })
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        receiverId: admin.id,
        senderId: submitterId,
        proposalId,
        type: 'STATUS_CHANGE',
        title: 'Proposal TA Baru Diterima',
        message: `Proposal TA baru dari ${mahasiswaName}${nim ? ` (${nim})` : ''}: "${proposalTitle}"`,
      })
    )
  )
}

export async function notifyPembimbingAssigned(
  pembimbingId: string,
  mahasiswaId: string,
  proposalId: string,
  proposalTitle: string,
  mahasiswaName: string,
  adminId: string
): Promise<void> {
  // Notify pembimbing
  await createNotification({
    receiverId: pembimbingId,
    senderId: adminId,
    proposalId,
    type: 'ASSIGNMENT',
    title: 'Penugasan sebagai Dosen Pembimbing',
    message: `Anda ditugaskan sebagai Pembimbing untuk proposal TA: "${proposalTitle}" oleh ${mahasiswaName}`,
  })
  // Notify mahasiswa
  await createNotification({
    receiverId: mahasiswaId,
    senderId: adminId,
    proposalId,
    type: 'ASSIGNMENT',
    title: 'Dosen Pembimbing Telah Ditentukan',
    message: `Dosen pembimbing Anda telah ditentukan untuk proposal TA: "${proposalTitle}"`,
  })
}

export async function notifyPengujiAssigned(
  pengujiId: string,
  mahasiswaId: string,
  proposalId: string,
  proposalTitle: string,
  mahasiswaName: string,
  nim: string | null | undefined,
  adminId: string
): Promise<void> {
  await createNotification({
    receiverId: pengujiId,
    senderId: adminId,
    proposalId,
    type: 'ASSIGNMENT',
    title: 'Penugasan sebagai Dosen Penguji',
    message: `Anda ditugaskan sebagai Penguji untuk proposal TA: "${proposalTitle}" oleh ${mahasiswaName}${nim ? ` (${nim})` : ''}`,
  })
  await createNotification({
    receiverId: mahasiswaId,
    senderId: adminId,
    proposalId,
    type: 'ASSIGNMENT',
    title: 'Dosen Penguji Telah Ditentukan',
    message: `Dosen penguji untuk proposal TA Anda telah ditentukan: "${proposalTitle}"`,
  })
}

export async function notifyAdminReviewSubmitted(
  proposalId: string,
  proposalTitle: string,
  pengujiName: string,
  pengujiId: string
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  })
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        receiverId: admin.id,
        senderId: pengujiId,
        proposalId,
        type: 'REVIEW_SUBMITTED',
        title: 'Hasil Ujian Dikirim',
        message: `${pengujiName} telah mengirimkan hasil penilaian untuk proposal TA: "${proposalTitle}"`,
      })
    )
  )
}

export async function notifyAdminAllReviewsDone(
  proposalId: string,
  proposalTitle: string
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  })
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        receiverId: admin.id,
        proposalId,
        type: 'REVIEW_SUBMITTED',
        title: 'Semua Penilaian Selesai',
        message: `Semua dosen penguji telah menyelesaikan penilaian untuk proposal TA: "${proposalTitle}"`,
      })
    )
  )
}

export async function notifyDecision(
  submitterId: string,
  pembimbingId: string | null | undefined,
  proposalId: string,
  proposalTitle: string,
  decision: string,
  adminId: string
): Promise<void> {
  const decisionMap: Record<string, string> = {
    APPROVED: 'Disetujui',
    REVISION: 'Perlu Revisi',
    REJECTED: 'Ditolak',
  }
  const label = decisionMap[decision] || decision

  await createNotification({
    receiverId: submitterId,
    senderId: adminId,
    proposalId,
    type: 'DECISION_MADE',
    title: `Keputusan Proposal TA: ${label}`,
    message: `Proposal TA Anda "${proposalTitle}" telah ${label.toLowerCase()}.`,
  })

  if (pembimbingId) {
    await createNotification({
      receiverId: pembimbingId,
      senderId: adminId,
      proposalId,
      type: 'DECISION_MADE',
      title: 'Keputusan Proposal TA Mahasiswa Bimbingan',
      message: `Keputusan untuk proposal TA mahasiswa bimbingan Anda telah dibuat: ${label} — "${proposalTitle}"`,
    })
  }
}
