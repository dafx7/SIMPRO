const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Check all proposals
  const proposals = await p.proposal.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      submitter: { select: { email: true, fullName: true } },
      pembimbing: { select: { email: true, fullName: true } },
      assignments: {
        include: { penguji: { select: { email: true, fullName: true } } }
      }
    }
  })

  console.log('\n=== PROPOSALS ===')
  proposals.forEach((p, i) => {
    console.log(`\nP${i+1} [${p.id}]`)
    console.log(`  Title: ${p.title.slice(0, 60)}`)
    console.log(`  Status: ${p.status}`)
    console.log(`  Submitter: ${p.submitter.email}`)
    console.log(`  Pembimbing: ${p.pembimbing?.email || 'NONE'}`)
    console.log(`  Penguji: ${p.assignments.map(a => a.penguji.email).join(', ') || 'NONE'}`)
    if (p.adminNotes) console.log(`  AdminNotes: ${p.adminNotes.slice(0, 60)}`)
  })

  // Check users
  const users = await p.user.findMany({
    select: { email: true, fullName: true, role: true, expertise: true },
    orderBy: { role: 'asc' }
  })
  console.log('\n=== USERS ===')
  users.forEach(u => console.log(`  [${u.role}] ${u.email} — ${u.fullName} ${u.expertise ? `(${u.expertise.slice(0,30)})` : ''}`))
}

main().finally(() => p.$disconnect())
