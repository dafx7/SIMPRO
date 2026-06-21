const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
// Update Andi expertise with exact terms from P3: CNN, citra digital, hama, TensorFlow, OpenCV
p.user.update({
  where: { email: 'dosen6@wilmar.ac.id' },
  data: {
    expertise: 'Kecerdasan Buatan, Convolutional Neural Network, Deteksi Hama Tanaman Berbasis Citra Digital, TensorFlow, OpenCV, Python, Deep Learning, ResNet'
  }
}).then(u => {
  console.log('Updated expertise:', u.expertise)
  return p.$disconnect()
})
