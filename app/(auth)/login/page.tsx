'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { loginSchema, LoginInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Email atau password salah')
        return
      }

      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const role = session?.user?.role

      if (role === 'ADMIN') {
        router.push('/admin/proposals')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-wbi-cream">
      {/* Left branded panel */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-wbi-forest via-wbi-forest to-wbi-teal p-12 text-white">
        {/* decorative circle cluster, echoing the WBI logo dots */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 left-16 h-40 w-40 rounded-full bg-wbi-gold/30 blur-sm" />
          <div className="absolute top-24 left-44 h-28 w-28 rounded-full bg-wbi-teal-light/40" />
          <div className="absolute top-48 left-10 h-20 w-20 rounded-full bg-wbi-forest-light/60" />
          <div className="absolute bottom-24 right-16 h-32 w-32 rounded-full bg-wbi-teal-light/30" />
          <div className="absolute bottom-10 right-44 h-16 w-16 rounded-full bg-wbi-gold/20" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">SIMPRO</span>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <h1 className="font-heading text-4xl font-extrabold leading-tight">
            Kelola Proposal Tugas Akhir dengan Mudah
          </h1>
          <p className="text-white/80 leading-relaxed">
            Sistem Informasi Manajemen Proposal Tugas Akhir — menghubungkan mahasiswa,
            dosen pembimbing, dan dosen penguji dalam satu platform terpadu.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} Politeknik Wilmar Bisnis Indonesia
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-wbi-forest to-wbi-teal rounded-2xl mb-4 shadow-md shadow-wbi-teal/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-heading text-xl font-bold text-wbi-forest">SIMPRO</h1>
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-wbi-forest">Masuk ke Sistem</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan email dan password Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-wbi-olive">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@wilmar.ac.id"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-wbi-olive">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-10"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-wbi-teal/5 border border-wbi-teal/20 rounded-xl text-xs text-muted-foreground">
            <p className="font-medium mb-2 text-wbi-olive">Akun Demo:</p>
            <div className="space-y-1">
              <p>Admin: admin@wilmar.ac.id / Admin123!</p>
              <p>Dosen: dosen1@wilmar.ac.id / Dosen123!</p>
              <p>Mahasiswa: mhs1@wilmar.ac.id / Mahasiswa123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
