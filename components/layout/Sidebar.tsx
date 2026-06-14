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
}

export default function Sidebar({ role, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  const mahasiswaNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/proposals', label: 'Proposal TA Saya', icon: <FileText className="w-4 h-4" /> },
    { href: '/proposals/new', label: 'Ajukan Proposal Baru', icon: <PlusCircle className="w-4 h-4" /> },
    { href: '/notifications', label: 'Notifikasi', icon: <Bell className="w-4 h-4" />, badge: unreadCount },
  ]

  const dosenNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/proposals', label: 'Proposal Bimbingan & Ujian', icon: <FileText className="w-4 h-4" /> },
    { href: '/reviews', label: 'Penilaian Proposal', icon: <ClipboardList className="w-4 h-4" /> },
    { href: '/notifications', label: 'Notifikasi', icon: <Bell className="w-4 h-4" />, badge: unreadCount },
  ]

  const adminNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/admin/proposals', label: 'Semua Proposal TA', icon: <FileText className="w-4 h-4" /> },
    { href: '/admin/users', label: 'Kelola Pengguna', icon: <Users className="w-4 h-4" /> },
    { href: '/admin/reports', label: 'Laporan & Statistik', icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/notifications', label: 'Notifikasi', icon: <Bell className="w-4 h-4" />, badge: unreadCount },
  ]

  const navItems =
    role === 'ADMIN' ? adminNav : role === 'DOSEN' ? dosenNav : mahasiswaNav

  return (
    <aside className="w-64 min-h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-900" />
          </div>
          <div>
            <div className="font-bold text-sm">SIMPRO</div>
            <div className="text-xs text-blue-300">Politeknik Wilmar</div>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-blue-200 hover:bg-blue-800 hover:text-white"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Keluar
        </Button>
      </div>
    </aside>
  )
}
