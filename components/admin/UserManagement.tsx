'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, CreateUserInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, UserPlus, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  role: 'DOSEN' | 'MAHASISWA' | 'ADMIN'
  nim?: string | null
  nidn?: string | null
  jurusan?: string | null
  semester?: number | null
  angkatan?: number | null
  expertise?: string | null
  isActive: boolean
  createdAt: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin (Kaprodi)',
  MAHASISWA: 'Mahasiswa',
  DOSEN: 'Dosen',
}

const roleBadgeStyles: Record<string, string> = {
  ADMIN: 'bg-wbi-gold/10 text-wbi-gold-dark',
  MAHASISWA: 'bg-wbi-teal/10 text-wbi-teal-dark',
  DOSEN: 'bg-emerald-100 text-emerald-700',
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  })

  const selectedRole = watch('role')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
      })
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setUsers(data.data || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  useEffect(() => { setPage(1) }, [search, roleFilter])

  const handleAddUser = async (data: CreateUserInput) => {
    setIsAdding(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setTempPassword(result.tempPassword)
      toast.success('Pengguna berhasil ditambahkan!')
      reset()
      fetchUsers()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan pengguna')
    } finally {
      setIsAdding(false)
    }
  }

  const toggleUserActive = async (user: User) => {
    setUpdatingId(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) throw new Error('Gagal update')
      toast.success(`Pengguna ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchUsers()
    } catch {
      toast.error('Gagal mengubah status pengguna')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari nama, email, NIM, atau NIDN..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="DOSEN">Dosen</SelectItem>
            <SelectItem value="MAHASISWA">Mahasiswa</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setTempPassword(null) } }}>
          <DialogTrigger className="bg-gradient-to-br from-wbi-forest to-wbi-teal text-white inline-flex items-center justify-center rounded-xl text-sm font-medium h-9 px-4 py-2 cursor-pointer transition-all shadow-md shadow-wbi-teal/20 hover:shadow-lg hover:shadow-wbi-teal/30 hover:scale-[1.02]">
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tempPassword ? 'Pengguna Berhasil Ditambahkan' : 'Tambah Pengguna Baru'}</DialogTitle>
              <DialogDescription>
                {tempPassword
                  ? 'Bagikan password sementara ini kepada pengguna baru'
                  : 'Isi data pengguna baru yang akan didaftarkan ke sistem'}
              </DialogDescription>
            </DialogHeader>

            {tempPassword ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-sm text-gray-600 mb-2">Password Sementara:</p>
                  <p className="text-2xl font-mono font-bold text-emerald-700 tracking-widest">{tempPassword}</p>
                  <p className="text-xs text-gray-400 mt-2">Salin dan bagikan kepada pengguna. Password harus segera diganti.</p>
                </div>
                <Button variant="gradient" className="w-full" onClick={() => { setAddOpen(false); setTempPassword(null) }}>
                  Selesai
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(handleAddUser)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap *</Label>
                  <Input placeholder="Nama lengkap pengguna" {...register('fullName')} />
                  {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="email@wilmar.ac.id" {...register('email')} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select onValueChange={(v) => setValue('role', (v ?? 'MAHASISWA') as 'DOSEN' | 'MAHASISWA' | 'ADMIN')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAHASISWA">Mahasiswa</SelectItem>
                      <SelectItem value="DOSEN">Dosen</SelectItem>
                      <SelectItem value="ADMIN">Admin (Kaprodi)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
                </div>

                {selectedRole === 'DOSEN' && (
                  <>
                    <div className="space-y-2">
                      <Label>NIDN</Label>
                      <Input placeholder="Nomor Induk Dosen Nasional" {...register('nidn')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Keahlian</Label>
                      <Input placeholder="Bidang keahlian dosen" {...register('expertise')} />
                    </div>
                  </>
                )}

                {selectedRole === 'MAHASISWA' && (
                  <>
                    <div className="space-y-2">
                      <Label>NIM</Label>
                      <Input placeholder="Nomor Induk Mahasiswa" {...register('nim')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Jurusan</Label>
                      <Input placeholder="Program studi / jurusan" {...register('jurusan')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Semester</Label>
                        <Input type="number" placeholder="6" {...register('semester', { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Angkatan</Label>
                        <Input type="number" placeholder="2022" {...register('angkatan', { valueAsNumber: true })} />
                      </div>
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                  <Button type="submit" variant="gradient" disabled={isAdding}>
                    {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Tambah Pengguna'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-muted-foreground">{total} pengguna ditemukan</div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-wbi-cream">
              <th className="text-left p-3 font-semibold text-wbi-olive">Nama</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Email</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Role</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Info</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Status</th>
              <th className="text-left p-3 font-semibold text-wbi-olive">Terdaftar</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-3"><Skeleton className="h-6 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-6 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-8 w-24" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-muted-foreground">Tidak ada pengguna ditemukan</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-wbi-teal/5 transition-colors">
                  <td className="p-3">
                    <p className="font-medium">{user.fullName}</p>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{user.email}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleBadgeStyles[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {user.role === 'MAHASISWA' && (
                      <div>
                        {user.nim && <p>NIM: {user.nim}</p>}
                        {user.jurusan && <p>{user.jurusan}</p>}
                        {user.semester && <p>Semester {user.semester}{user.angkatan ? `, Angk. ${user.angkatan}` : ''}</p>}
                      </div>
                    )}
                    {user.role === 'DOSEN' && (
                      <div>
                        {user.nidn && <p>NIDN: {user.nidn}</p>}
                        {user.expertise && <p>{user.expertise}</p>}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {format(new Date(user.createdAt), 'd MMM yyyy', { locale: idLocale })}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserActive(user)}
                      disabled={updatingId === user.id}
                      className={user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
                    >
                      {updatingId === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : user.isActive ? (
                        'Nonaktifkan'
                      ) : (
                        'Aktifkan'
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" className="rounded-full" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" className="rounded-full" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
