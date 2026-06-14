import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role: string
    fullName?: string
    nim?: string | null
    jurusan?: string | null
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      fullName: string
      role: string
      nim?: string | null
      jurusan?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    fullName: string
    nim?: string | null
    jurusan?: string | null
  }
}
