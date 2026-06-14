import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function getEmailTemplate(title: string, message: string, linkUrl?: string, linkText?: string): string {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
      .container{max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden}
      .header{background:#1e40af;color:white;padding:24px;text-align:center}
      .header h1{margin:0;font-size:20px}.header p{margin:4px 0 0;font-size:13px;opacity:.8}
      .body{padding:32px}.title{font-size:18px;font-weight:bold;color:#1e293b;margin-bottom:16px}
      .message{color:#475569;line-height:1.6}
      .btn{display:inline-block;margin-top:24px;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:6px;font-weight:bold}
      .footer{padding:16px 32px;background:#f8fafc;text-align:center;color:#94a3b8;font-size:12px}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>SIMPRO</h1><p>Politeknik Wilmar Bisnis Indonesia — Sistem Manajemen Proposal Tugas Akhir</p></div>
      <div class="body">
        <div class="title">${title}</div>
        <div class="message">${message}</div>
        ${linkUrl ? `<a href="${process.env.NEXTAUTH_URL}${linkUrl}" class="btn">${linkText || 'Lihat Detail'}</a>` : ''}
      </div>
      <div class="footer">Email ini dikirim otomatis oleh sistem SIMPRO. Harap tidak membalas email ini.</div>
    </div></body></html>
  `
}

export async function sendEmail(
  to: string,
  subject: string,
  title: string,
  message: string,
  linkUrl?: string,
  linkText?: string
): Promise<void> {
  if (!process.env.GMAIL_USER || process.env.GMAIL_USER === 'your-gmail@gmail.com') {
    console.log(`[EMAIL SKIPPED] To: ${to}, Subject: ${subject}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"SIMPRO Politeknik Wilmar" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: getEmailTemplate(title, message, linkUrl, linkText),
    })
  } catch (error) {
    console.error('Email send failed:', error)
  }
}

export async function sendProposalSubmittedEmail(
  adminEmail: string,
  proposalTitle: string,
  mahasiswaName: string,
  nim: string | null | undefined
): Promise<void> {
  await sendEmail(
    adminEmail,
    `Proposal TA Baru: ${proposalTitle}`,
    'Proposal Tugas Akhir Baru Diterima',
    `<strong>${mahasiswaName}${nim ? ` (NIM: ${nim})` : ''}</strong> telah mengajukan proposal TA berjudul <strong>"${proposalTitle}"</strong>. Silakan segera tinjau dan tugaskan pembimbing.`,
    '/admin/proposals',
    'Lihat Proposal'
  )
}

export async function sendPembimbingAssignedEmail(
  dosenEmail: string,
  dosenName: string,
  proposalTitle: string,
  mahasiswaName: string,
  proposalId: string
): Promise<void> {
  await sendEmail(
    dosenEmail,
    `Penugasan Pembimbing TA: ${proposalTitle}`,
    'Anda Ditugaskan sebagai Dosen Pembimbing',
    `Yth. <strong>${dosenName}</strong>,<br><br>Anda telah ditugaskan sebagai Dosen Pembimbing untuk proposal Tugas Akhir berjudul <strong>"${proposalTitle}"</strong> oleh mahasiswa <strong>${mahasiswaName}</strong>.`,
    `/proposals/${proposalId}`,
    'Lihat Proposal'
  )
}

export async function sendPengujiAssignedEmail(
  dosenEmail: string,
  dosenName: string,
  proposalTitle: string,
  mahasiswaName: string,
  nim: string | null | undefined,
  proposalId: string,
  deadline: Date
): Promise<void> {
  const deadlineStr = deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  await sendEmail(
    dosenEmail,
    `Penugasan Penguji TA: ${proposalTitle}`,
    'Anda Ditugaskan sebagai Dosen Penguji',
    `Yth. <strong>${dosenName}</strong>,<br><br>Anda telah ditugaskan sebagai Dosen Penguji untuk proposal Tugas Akhir berjudul <strong>"${proposalTitle}"</strong> oleh mahasiswa <strong>${mahasiswaName}${nim ? ` (NIM: ${nim})` : ''}</strong>.<br>Batas waktu penilaian: <strong>${deadlineStr}</strong>.`,
    `/proposals/${proposalId}`,
    'Mulai Penilaian'
  )
}

export async function sendDecisionEmail(
  mahasiswaEmail: string,
  mahasiswaName: string,
  proposalTitle: string,
  proposalId: string,
  decision: string,
  notes?: string
): Promise<void> {
  const decisionMap: Record<string, string> = { APPROVED: 'Disetujui', REVISION: 'Perlu Revisi', REJECTED: 'Ditolak' }
  const label = decisionMap[decision] || decision
  await sendEmail(
    mahasiswaEmail,
    `Keputusan Proposal TA: ${label}`,
    `Keputusan Proposal TA: ${label}`,
    `Yth. <strong>${mahasiswaName}</strong>,<br><br>Proposal Tugas Akhir Anda berjudul <strong>"${proposalTitle}"</strong> telah mendapat keputusan: <strong>${label}</strong>.${notes ? `<br><br>Catatan: ${notes}` : ''}`,
    `/proposals/${proposalId}`,
    'Lihat Detail Proposal'
  )
}
