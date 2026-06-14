# SIMPRO - Sistem Informasi Manajemen Proposal Penelitian

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- shadcn/ui v4 (uses @base-ui/react, NOT Radix UI)
- Prisma v5 + PostgreSQL
- NextAuth.js v5 beta

## Important: shadcn/ui v4 API
`asChild` is NOT supported. Use `render` or style triggers directly.
Select `onValueChange` receives `string | null`.

## Dev Commands
```
npm run dev           # localhost:3000
npx prisma db push    # sync schema
npx ts-node prisma/seed.ts  # re-seed
npx tsc --noEmit      # type check
```

## Test Accounts
- Admin: admin@wilmar.ac.id / Admin123!
- Reviewer: reviewer1@wilmar.ac.id / Reviewer123!
- Dosen: dosen1@wilmar.ac.id / Dosen123!

## Database
postgresql://postgres:12345678@localhost:5432/simpro
