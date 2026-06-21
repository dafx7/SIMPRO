/**
 * Supplemental demo seed — adds all data needed for the 5 demo scenarios.
 * Safe to run multiple times (upsert / skipDuplicates throughout).
 *
 * Demo scenarios:
 *  1. AI Rekomendasi Penguji  → P3 (CNN Hama Padi, SUBMITTED) + Dr. Andi Pratama
 *  2. Similarity Detection    → P4 (Deteksi Penyakit Tanaman, SUBMITTED) similar to P3
 *  3. Full Workflow           → P1 (APPROVED, adminNotes) + P3 (SUBMITTED)
 *  4. Revision Flow           → P5 (REVISION, by mhs4)
 *  5. Dosen View              → dosen2 + P2 (already in main seed, verified here)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Running demo-seed...\n')

  // ── Passwords ──────────────────────────────────────────────────────────────
  const dosenHash  = await bcrypt.hash('Dosen123!',     12)
  const mhsHash    = await bcrypt.hash('Mahasiswa123!', 12)

  // ── 1. New dosen: Dr. Andi Pratama (Computer Vision / AI) ─────────────────
  const dosen6 = await prisma.user.upsert({
    where:  { email: 'dosen6@wilmar.ac.id' },
    update: { expertise: 'Kecerdasan Buatan, Computer Vision, dan Machine Learning' },
    create: {
      email:        'dosen6@wilmar.ac.id',
      passwordHash: dosenHash,
      fullName:     'Dr. Andi Pratama, M.T',
      role:         'DOSEN',
      nidn:         '0012345606',
      expertise:    'Kecerdasan Buatan, Computer Vision, dan Machine Learning',
    },
  })
  console.log('✓ dosen6 (Dr. Andi Pratama):', dosen6.id)

  // Update dosen1 expertise to mention AI as well (RPL + AI overlap helps Demo 1 contrast)
  await prisma.user.update({
    where: { email: 'dosen1@wilmar.ac.id' },
    data:  { expertise: 'Rekayasa Perangkat Lunak dan Pemrograman Sistem' },
  })
  console.log('✓ dosen1 expertise updated')

  // ── 2. New mahasiswa: mhs4 Diana Permata (TRPL) ───────────────────────────
  const mhs4 = await prisma.user.upsert({
    where:  { email: 'mhs4@wilmar.ac.id' },
    update: {},
    create: {
      email:        'mhs4@wilmar.ac.id',
      passwordHash: mhsHash,
      fullName:     'Diana Permata',
      role:         'MAHASISWA',
      nim:          '2022001004',
      jurusan:      'Teknologi Rekayasa Perangkat Lunak',
      semester:     6,
      angkatan:     2022,
    },
  })
  console.log('✓ mhs4 (Diana Permata):', mhs4.id)

  // ── 3. Resolve existing user IDs ──────────────────────────────────────────
  const admin  = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@wilmar.ac.id'  } })
  const dosen1 = await prisma.user.findUniqueOrThrow({ where: { email: 'dosen1@wilmar.ac.id' } })
  const dosen6r= await prisma.user.findUniqueOrThrow({ where: { email: 'dosen6@wilmar.ac.id' } })
  const mhs1   = await prisma.user.findUniqueOrThrow({ where: { email: 'mhs1@wilmar.ac.id'   } })

  // ── 4. Proposal 1 — add adminNotes (update only) ──────────────────────────
  await prisma.proposal.update({
    where: { id: 'seed-proposal-1' },
    data: {
      adminNotes: 'Proposal disetujui dengan penilaian sangat baik dari seluruh penguji. Penelitian memiliki kontribusi nyata bagi manajemen inventaris UMKM. Lanjutkan ke tahap seminar hasil.',
    },
  })
  console.log('✓ P1 adminNotes updated')

  // ── 5. Proposal 3 — CNN Hama Padi (SUBMITTED, mhs1, pembimbing dosen6) ───
  //    Overwrite the agrowisata draft with the correct demo content.
  await prisma.proposal.upsert({
    where:  { id: 'seed-proposal-3' },
    update: {
      title:          'Sistem Deteksi Hama Padi Menggunakan Convolutional Neural Network Berbasis Citra Digital',
      abstract:       'Penelitian ini mengembangkan sistem deteksi hama padi menggunakan Convolutional Neural Network (CNN) berbasis analisis citra digital. Sistem menggunakan dataset 5.000 gambar tanaman padi yang terinfeksi berbagai jenis hama, dilatih dengan arsitektur ResNet-50 dan mencapai akurasi 94,3% pada data uji. Implementasi menggunakan Python, TensorFlow, dan OpenCV dengan antarmuka berbasis web menggunakan Flask. Sistem mampu mendeteksi 8 jenis hama padi secara real-time dengan waktu inferensi rata-rata 150ms per gambar, sehingga dapat membantu petani dalam pengendalian hama secara dini dan efisien.',
      jurusan:        'Teknologi Rekayasa Perangkat Lunak',
      status:         'SUBMITTED',
      submitterId:    mhs1.id,
      pembimbingId:   dosen6r.id,
      submissionDate: new Date('2025-01-10'),
      reviewDeadline: new Date('2025-02-10'),
    },
    create: {
      id:             'seed-proposal-3',
      title:          'Sistem Deteksi Hama Padi Menggunakan Convolutional Neural Network Berbasis Citra Digital',
      abstract:       'Penelitian ini mengembangkan sistem deteksi hama padi menggunakan Convolutional Neural Network (CNN) berbasis analisis citra digital. Sistem menggunakan dataset 5.000 gambar tanaman padi yang terinfeksi berbagai jenis hama, dilatih dengan arsitektur ResNet-50 dan mencapai akurasi 94,3% pada data uji. Implementasi menggunakan Python, TensorFlow, dan OpenCV dengan antarmuka berbasis web menggunakan Flask. Sistem mampu mendeteksi 8 jenis hama padi secara real-time dengan waktu inferensi rata-rata 150ms per gambar, sehingga dapat membantu petani dalam pengendalian hama secara dini dan efisien.',
      jurusan:        'Teknologi Rekayasa Perangkat Lunak',
      status:         'SUBMITTED',
      submitterId:    mhs1.id,
      pembimbingId:   dosen6r.id,
      submissionDate: new Date('2025-01-10'),
      reviewDeadline: new Date('2025-02-10'),
    },
  })

  await prisma.statusHistory.createMany({
    skipDuplicates: true,
    data: [
      { proposalId: 'seed-proposal-3', fromStatus: null, toStatus: 'SUBMITTED', changedBy: mhs1.fullName, createdAt: new Date('2025-01-10') },
    ],
  })
  console.log('✓ P3 (CNN Hama Padi, SUBMITTED)')

  // ── 6. Proposal 4 — Deteksi Penyakit Tanaman (SUBMITTED, mhs4) ────────────
  //    High similarity to P3 for Demo 2 (similarity score > 70%).
  const p4 = await prisma.proposal.upsert({
    where:  { id: 'seed-proposal-4' },
    update: {
      title:          'Deteksi Penyakit Tanaman Padi Berbasis Deep Learning dan Analisis Citra Digital',
      abstract:       'Tugas akhir ini merancang sistem pendeteksian penyakit tanaman padi menggunakan metode deep learning berbasis analisis citra digital. Sistem menggunakan Convolutional Neural Network dengan arsitektur VGG-16 yang dilatih menggunakan dataset citra daun padi sebanyak 4.200 gambar yang dikategorikan ke dalam 6 kelas penyakit. Model mencapai akurasi 91,7% pada data validasi. Sistem dikembangkan dengan Python, Keras, dan OpenCV, serta diintegrasikan ke dalam aplikasi mobile berbasis Android untuk memudahkan petani dalam mendiagnosa penyakit tanaman padi di lapangan secara real-time.',
      jurusan:        'Teknologi Rekayasa Perangkat Lunak',
      status:         'SUBMITTED',
      submitterId:    mhs4.id,
      pembimbingId:   dosen1.id,
      submissionDate: new Date('2025-01-15'),
    },
    create: {
      id:             'seed-proposal-4',
      title:          'Deteksi Penyakit Tanaman Padi Berbasis Deep Learning dan Analisis Citra Digital',
      abstract:       'Tugas akhir ini merancang sistem pendeteksian penyakit tanaman padi menggunakan metode deep learning berbasis analisis citra digital. Sistem menggunakan Convolutional Neural Network dengan arsitektur VGG-16 yang dilatih menggunakan dataset citra daun padi sebanyak 4.200 gambar yang dikategorikan ke dalam 6 kelas penyakit. Model mencapai akurasi 91,7% pada data validasi. Sistem dikembangkan dengan Python, Keras, dan OpenCV, serta diintegrasikan ke dalam aplikasi mobile berbasis Android untuk memudahkan petani dalam mendiagnosa penyakit tanaman padi di lapangan secara real-time.',
      jurusan:        'Teknologi Rekayasa Perangkat Lunak',
      status:         'SUBMITTED',
      submitterId:    mhs4.id,
      pembimbingId:   dosen1.id,
      submissionDate: new Date('2025-01-15'),
    },
  })

  await prisma.statusHistory.createMany({
    skipDuplicates: true,
    data: [
      { proposalId: p4.id, fromStatus: null, toStatus: 'SUBMITTED', changedBy: mhs4.fullName, createdAt: new Date('2025-01-15') },
    ],
  })
  console.log('✓ P4 (Deteksi Penyakit Tanaman, SUBMITTED):', p4.id)

  // ── 7. Proposal 5 — REVISION (mhs4) ──────────────────────────────────────
  const p5 = await prisma.proposal.upsert({
    where:  { id: 'seed-proposal-5' },
    update: {
      title:       'Implementasi Sistem Keamanan Jaringan Berbasis Intrusion Detection System Menggunakan Machine Learning',
      abstract:    'Penelitian ini mengimplementasikan sistem keamanan jaringan berbasis Intrusion Detection System (IDS) menggunakan algoritma machine learning untuk mendeteksi serangan siber secara real-time. Sistem menggunakan dataset NSL-KDD yang berisi 148.517 record lalu lintas jaringan dengan 4 kelas serangan utama. Model Random Forest dan SVM diuji dengan akurasi masing-masing 97,2% dan 95,8%. Sistem diimplementasikan menggunakan Python dan Scikit-learn dengan antarmuka monitoring berbasis web menggunakan Django.',
      jurusan:     'Teknologi Rekayasa Perangkat Lunak',
      status:      'REVISION',
      submitterId: mhs4.id,
      adminNotes:  'Proposal perlu diperbaiki pada bagian metodologi: (1) Perjelas teknik preprocessing dataset NSL-KDD yang digunakan; (2) Tambahkan analisis perbandingan performa antar model secara lebih mendalam dengan confusion matrix dan ROC curve; (3) Perbaiki rumusan masalah agar lebih spesifik dan terukur. Harap revisi dan kirim ulang dalam 2 minggu.',
    },
    create: {
      id:          'seed-proposal-5',
      title:       'Implementasi Sistem Keamanan Jaringan Berbasis Intrusion Detection System Menggunakan Machine Learning',
      abstract:    'Penelitian ini mengimplementasikan sistem keamanan jaringan berbasis Intrusion Detection System (IDS) menggunakan algoritma machine learning untuk mendeteksi serangan siber secara real-time. Sistem menggunakan dataset NSL-KDD yang berisi 148.517 record lalu lintas jaringan dengan 4 kelas serangan utama. Model Random Forest dan SVM diuji dengan akurasi masing-masing 97,2% dan 95,8%. Sistem diimplementasikan menggunakan Python dan Scikit-learn dengan antarmuka monitoring berbasis web menggunakan Django.',
      jurusan:     'Teknologi Rekayasa Perangkat Lunak',
      status:      'REVISION',
      submitterId: mhs4.id,
      adminNotes:  'Proposal perlu diperbaiki pada bagian metodologi: (1) Perjelas teknik preprocessing dataset NSL-KDD yang digunakan; (2) Tambahkan analisis perbandingan performa antar model secara lebih mendalam dengan confusion matrix dan ROC curve; (3) Perbaiki rumusan masalah agar lebih spesifik dan terukur. Harap revisi dan kirim ulang dalam 2 minggu.',
    },
  })

  await prisma.statusHistory.createMany({
    skipDuplicates: true,
    data: [
      { proposalId: p5.id, fromStatus: null,        toStatus: 'SUBMITTED',   changedBy: mhs4.fullName,    createdAt: new Date('2025-01-08') },
      { proposalId: p5.id, fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW',changedBy: admin.fullName,   createdAt: new Date('2025-01-10') },
      { proposalId: p5.id, fromStatus: 'UNDER_REVIEW', toStatus: 'REVISION', changedBy: admin.fullName,   notes: 'Metodologi perlu diperkuat. Lihat catatan Kaprodi.', createdAt: new Date('2025-01-18') },
    ],
  })
  console.log('✓ P5 (IDS Machine Learning, REVISION):', p5.id)

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n=== DEMO SEED COMPLETE ===')
  console.log('\nTest Accounts:')
  console.log('  Admin:   admin@wilmar.ac.id    / Admin123!')
  console.log('  Dosen 1: dosen1@wilmar.ac.id   / Dosen123!  (RPL)')
  console.log('  Dosen 2: dosen2@wilmar.ac.id   / Dosen123!  (Akuntansi)')
  console.log('  Dosen 6: dosen6@wilmar.ac.id   / Dosen123!  (AI/Computer Vision) ← NEW')
  console.log('  Mhs 1:   mhs1@wilmar.ac.id     / Mahasiswa123!')
  console.log('  Mhs 4:   mhs4@wilmar.ac.id     / Mahasiswa123!  ← NEW')
  console.log('\nProposals:')
  console.log('  P1 seed-proposal-1  APPROVED     Sistem Inventaris (mhs1)')
  console.log('  P2 seed-proposal-2  UNDER_REVIEW E-Filing Pajak (mhs2, pembimbing dosen2)')
  console.log('  P3 seed-proposal-3  SUBMITTED    CNN Hama Padi (mhs1, pembimbing dosen6)')
  console.log('  P4 seed-proposal-4  SUBMITTED    Deteksi Penyakit Tanaman (mhs4)')
  console.log('  P5 seed-proposal-5  REVISION     IDS Machine Learning (mhs4)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
