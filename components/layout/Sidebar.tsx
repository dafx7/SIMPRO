'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ClipboardList,
  Users,
  BarChart3,
  Bell,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  role: string
  unreadCount?: number
  userName?: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Kaprodi / Admin',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
}

export default function Sidebar({ role, unreadCount = 0, userName }: SidebarProps) {
  const pathname = usePathname()

  const mahasiswaNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[20px] h-[20px]" /> },
    { href: '/proposals', label: 'Proposal TA Saya', icon: <FileText className="w-[20px] h-[20px]" /> },
    { href: '/proposals/new', label: 'Ajukan Proposal Baru', icon: <PlusCircle className="w-[20px] h-[20px]" /> },
    { href: '/notifications', label: 'Notifikasi', icon: <Bell className="w-[20px] h-[20px]" />, badge: unreadCount },
  ]

  const dosenNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[20px] h-[20px]" /> },
    { href: '/proposals', label: 'Proposal Bimbingan & Ujian', icon: <FileText className="w-[20px] h-[20px]" /> },
    { href: '/reviews', label: 'Penilaian Proposal', icon: <ClipboardList className="w-[20px] h-[20px]" /> },
    { href: '/notifications', label: 'Notifikasi', icon: <Bell className="w-[20px] h-[20px]" />, badge: unreadCount },
  ]

  const adminNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[20px] h-[20px]" /> },
    { href: '/admin/proposals', label: 'Semua Proposal TA', icon: <FileText className="w-[20px] h-[20px]" /> },
    { href: '/admin/users', label: 'Kelola Pengguna', icon: <Users className="w-[20px] h-[20px]" /> },
    { href: '/admin/reports', label: 'Laporan & Statistik', icon: <BarChart3 className="w-[20px] h-[20px]" /> },
    { href: '/notifications', label: 'Notifikasi', icon: <Bell className="w-[20px] h-[20px]" />, badge: unreadCount },
  ]

  const navItems =
    role === 'ADMIN' ? adminNav : role === 'DOSEN' ? dosenNav : mahasiswaNav

  const initials = (userName || '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="w-64 min-h-screen bg-wbi-forest text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-wbi-forest" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-wbi-gold ring-2 ring-wbi-forest" />
          </div>
          <div>
            <div className="font-heading font-bold text-sm tracking-tight">SIMPRO</div>
            <div className="text-xs text-white/50">Politeknik Wilmar</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                isActive
                  ? 'bg-wbi-teal text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-wbi-gold" />
              )}
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge className="bg-wbi-gold text-wbi-forest text-xs px-1.5 py-0.5 min-w-[20px] text-center font-semibold">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {userName && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wbi-teal text-xs font-semibold text-white">
              {initials || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-white/50">{roleLabels[role] || role}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Keluar
        </Button>
      </div>
    </aside>
  )
}
