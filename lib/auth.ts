import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          nim: user.nim,
          jurusan: user.jurusan,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || ''
        token.role = (user as { role: string }).role || 'MAHASISWA'
        token.fullName = user.name || ''
        token.nim = (user as { nim?: string | null }).nim ?? null
        token.jurusan = (user as { jurusan?: string | null }).jurusan ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) || ''
        session.user.role = (token.role as string) || 'MAHASISWA'
        session.user.fullName = (token.fullName as string) || session.user.name || ''
        session.user.nim = (token.nim as string | null) ?? null
        session.user.jurusan = (token.jurusan as string | null) ?? null
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})
