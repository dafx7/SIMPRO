const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.reviewerAssignment.findMany({
  where: { reviewForm: null },
  include: {
    penguji: { select: { email: true, fullName: true } },
    proposal: { select: { title: true, status: true } }
  },
  take: 10
}).then(r => {
  console.log(JSON.stringify(r, null, 2))
  return p.$disconnect()
})
