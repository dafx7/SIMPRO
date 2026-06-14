import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Jurusan
  const jurusanList = [
    'Teknologi Rekayasa Perangkat Lunak',
    'Akuntansi Perpajakan',
    'Agribisnis Hortikultura',
    'Manajemen Pemasaran Internasional',
    'Pengelolaan Konvensi dan Acara',
  ]
  for (const name of jurusanList) {
    await prisma.jurusan.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  // Admin
  const adminHash = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wilmar.ac.id' },
    update: {},
    create: {
      email: 'admin@wilmar.ac.id',
      passwordHash: adminHash,
      fullName: 'Dr. Kaprodi Wilmar',
      role: 'ADMIN',
    },
  })

  // Dosen
  const dosenHash = await bcrypt.hash('Dosen123!', 12)
  const dosenData = [
    { email: 'dosen1@wilmar.ac.id', fullName: 'Dr. Budi Santoso, M.Kom', nidn: '0012345601', expertise: 'Rekayasa Perangkat Lunak' },
    { email: 'dosen2@wilmar.ac.id', fullName: 'Dr. Siti Rahayu, M.Ak', nidn: '0012345602', expertise: 'Akuntansi dan Perpajakan' },
    { email: 'dosen3@wilmar.ac.id', fullName: 'Dr. Agus Wijaya, M.P', nidn: '0012345603', expertise: 'Agribisnis' },
    { email: 'dosen4@wilmar.ac.id', fullName: 'Dr. Maya Indah, M.M', nidn: '0012345604', expertise: 'Manajemen Pemasaran' },
    { email: 'dosen5@wilmar.ac.id', fullName: 'Dr. Reza Firmansyah, M.Par', nidn: '0012345605', expertise: 'Pariwisata dan Event' },
  ]
  const dosens: { id: string; fullName: string }[] = []
  for (const d of dosenData) {
    const dosen = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash: dosenHash,
        fullName: d.fullName,
        role: 'DOSEN',
        nidn: d.nidn,
        expertise: d.expertise,
      },
    })
    dosens.push(dosen)
  }

  // Mahasiswa
  const mhsHash = await bcrypt.hash('Mahasiswa123!', 12)
  const mhsData = [
    { email: 'mhs1@wilmar.ac.id', fullName: 'Ahmad Fauzi', nim: '2022001001', jurusan: 'Teknologi Rekayasa Perangkat Lunak', semester: 6, angkatan: 2022 },
    { email: 'mhs2@wilmar.ac.id', fullName: 'Putri Rahayu', nim: '2022002001', jurusan: 'Akuntansi Perpajakan', semester: 6, angkatan: 2022 },
    { email: 'mhs3@wilmar.ac.id', fullName: 'Benny Kusuma', nim: '2022003001', jurusan: 'Agribisnis Hortikultura', semester: 6, angkatan: 2022 },
  ]
  const mahasiswas: { id: string; fullName: string; nim: string | null; jurusan: string | null }[] = []
  for (const m of mhsData) {
    const mhs = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash: mhsHash,
        fullName: m.fullName,
        role: 'MAHASISWA',
        nim: m.nim,
        jurusan: m.jurusan,
        semester: m.semester,
        angkatan: m.angkatan,
      },
    })
    mahasiswas.push(mhs)
  }

  // Sample proposals
  const proposal1 = await prisma.proposal.upsert({
    where: { id: 'seed-proposal-1' },
    update: {},
    create: {
      id: 'seed-proposal-1',
      title: 'Sistem Informasi Manajemen Inventaris Berbasis Web dengan Notifikasi Real-Time',
      abstract:
        'Tugas Akhir ini bertujuan untuk merancang dan mengimplementasikan sistem informasi manajemen inventaris berbasis web yang dilengkapi dengan fitur notifikasi real-time menggunakan WebSocket. Sistem ini dibangun menggunakan teknologi Next.js untuk frontend, Node.js untuk backend, dan PostgreSQL sebagai basis data. Hasil implementasi menunjukkan bahwa sistem mampu mengelola inventaris secara efisien dengan response time rata-rata di bawah 200ms dan tingkat akurasi data mencapai 99,8%.',
      jurusan: 'Teknologi Rekayasa Perangkat Lunak',
      status: 'APPROVED',
      submitterId: mahasiswas[0].id,
      pembimbingId: dosens[0].id,
      submissionDate: new Date('2024-10-15'),
    },
  })

  await prisma.statusHistory.createMany({
    skipDuplicates: true,
    data: [
      { proposalId: proposal1.id, fromStatus: null, toStatus: 'SUBMITTED', changedBy: mahasiswas[0].fullName, createdAt: new Date('2024-10-15') },
      { proposalId: proposal1.id, fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', changedBy: admin.fullName, createdAt: new Date('2024-10-17') },
      { proposalId: proposal1.id, fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED', changedBy: admin.fullName, notes: 'Proposal memenuhi semua kriteria penilaian.', createdAt: new Date('2024-10-25') },
    ],
  })

  const proposal2 = await prisma.proposal.upsert({
    where: { id: 'seed-proposal-2' },
    update: {},
    create: {
      id: 'seed-proposal-2',
      title: 'Analisis Implementasi E-Filing Pajak terhadap Kepatuhan Wajib Pajak Badan di Kota Medan',
      abstract:
        'Tugas akhir ini menganalisis pengaruh implementasi sistem e-filing pajak yang dikeluarkan oleh Direktorat Jenderal Pajak terhadap tingkat kepatuhan wajib pajak badan di Kota Medan. Penelitian menggunakan metode kuantitatif dengan pendekatan survei kepada 100 responden wajib pajak badan. Hasil penelitian menunjukkan bahwa implementasi e-filing berpengaruh signifikan terhadap kepatuhan wajib pajak dengan nilai signifikansi 0.000 (< 0.05) dan R-square sebesar 0.68.',
      jurusan: 'Akuntansi Perpajakan',
      status: 'UNDER_REVIEW',
      submitterId: mahasiswas[1].id,
      pembimbingId: dosens[1].id,
      submissionDate: new Date('2024-11-01'),
      reviewDeadline: new Date('2025-12-01'),
    },
  })

  await prisma.statusHistory.createMany({
    skipDuplicates: true,
    data: [
      { proposalId: proposal2.id, fromStatus: null, toStatus: 'SUBMITTED', changedBy: mahasiswas[1].fullName, createdAt: new Date('2024-11-01') },
      { proposalId: proposal2.id, fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', changedBy: admin.fullName, createdAt: new Date('2024-11-05') },
    ],
  })

  await prisma.reviewerAssignment.createMany({
    skipDuplicates: true,
    data: [
      { proposalId: proposal2.id, pengujiId: dosens[2].id, status: 'ASSIGNED', assignedAt: new Date('2024-11-05') },
    ],
  })

  const proposal3 = await prisma.proposal.upsert({
    where: { id: 'seed-proposal-3' },
    update: {},
    create: {
      id: 'seed-proposal-3',
      title: 'Strategi Pengembangan Agrowisata Berbasis Komunitas di Desa Suka Makmur',
      abstract:
        'Tugas akhir ini membahas pengembangan agrowisata berbasis komunitas di Desa Suka Makmur sebagai upaya meningkatkan pendapatan petani dan daya tarik wisata daerah. Menggunakan metode analisis SWOT dan FGD dengan stakeholder, penelitian ini menghasilkan rekomendasi strategi pengembangan yang meliputi pemberdayaan petani lokal, pengembangan infrastruktur wisata, dan pemasaran digital.',
      jurusan: 'Agribisnis Hortikultura',
      status: 'DRAFT',
      submitterId: mahasiswas[2].id,
    },
  })

  console.log('Seed completed!')
  console.log('Accounts:')
  console.log('  Admin: admin@wilmar.ac.id / Admin123!')
  console.log('  Dosen 1: dosen1@wilmar.ac.id / Dosen123!')
  console.log('  Dosen 2: dosen2@wilmar.ac.id / Dosen123!')
  console.log('  Mahasiswa 1: mhs1@wilmar.ac.id / Mahasiswa123!')
  console.log('  Mahasiswa 2: mhs2@wilmar.ac.id / Mahasiswa123!')
  console.log('  Mahasiswa 3: mhs3@wilmar.ac.id / Mahasiswa123!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
