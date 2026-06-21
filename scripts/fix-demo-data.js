/**
 * Fix two issues found in demo readiness check:
 *  1. P3 pembimbing is dosen6 (Andi) → excluded from AI recommendation
 *     Fix: change pembimbing to dosen1 (Budi Santoso, RPL)
 *  2. P4 abstract not similar enough to P3 (44.9% < 70%)
 *     Fix: rewrite P4 to share nearly identical technical terminology with P3
 */
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const dosen1 = await p.user.findUnique({ where: { email: 'dosen1@wilmar.ac.id' } })
  if (!dosen1) throw new Error('dosen1 not found')

  // Fix 1: change P3 pembimbing from dosen6 (Andi) to dosen1 (Budi)
  // so Dr. Andi can appear as recommended penguji
  await p.proposal.update({
    where: { id: 'seed-proposal-3' },
    data:  { pembimbingId: dosen1.id },
  })
  console.log('✓ P3 pembimbing changed to dosen1 (Dr. Budi Santoso, RPL)')

  // Fix 2: rewrite P4 with text nearly identical to P3 to push similarity >70%
  // Key shared terms: CNN, Convolutional Neural Network, citra digital, hama padi,
  //   Python, TensorFlow, OpenCV, ResNet-50, real-time, dataset, gambar tanaman padi,
  //   akurasi, dilatih, inferensi, petani, pengendalian hama, dini dan efisien
  await p.proposal.update({
    where: { id: 'seed-proposal-4' },
    data: {
      title: 'Sistem Deteksi Hama dan Penyakit Tanaman Padi Menggunakan Convolutional Neural Network Berbasis Citra Digital',
      abstract: 'Penelitian ini mengembangkan sistem deteksi hama dan penyakit tanaman padi menggunakan Convolutional Neural Network (CNN) berbasis analisis citra digital. Sistem menggunakan dataset 4.500 gambar tanaman padi yang terinfeksi berbagai jenis hama, dilatih dengan arsitektur ResNet-50 dan mencapai akurasi 91,7% pada data uji. Implementasi menggunakan Python, TensorFlow, dan OpenCV dengan antarmuka berbasis web menggunakan Django. Sistem mampu mendeteksi 6 jenis hama padi secara real-time dengan waktu inferensi rata-rata 180ms per gambar, sehingga dapat membantu petani dalam pengendalian hama secara dini dan efisien. Pengujian dilakukan terhadap 500 gambar tanaman padi dari lahan pertanian berbeda dan menunjukkan tingkat presisi 93,4% serta recall 90,2%.',
    },
  })
  console.log('✓ P4 title and abstract updated (near-identical to P3 for high similarity score)')

  // Verify
  const p3 = await p.proposal.findUnique({ where: { id: 'seed-proposal-3' }, include: { pembimbing: { select: { fullName: true, email: true } } } })
  const p4 = await p.proposal.findUnique({ where: { id: 'seed-proposal-4' }, select: { title: true } })
  console.log('\nVerification:')
  console.log('  P3 pembimbing:', p3?.pembimbing?.fullName, '(', p3?.pembimbing?.email, ')')
  console.log('  P4 title:', p4?.title?.slice(0, 70))
}

main().finally(() => p.$disconnect())
