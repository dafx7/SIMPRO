'use client'

import Link from 'next/link'
import { Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOut } from 'next-auth/react'

interface HeaderProps {
  user: {
    fullName: string
    email: string
    role: string
  }
  unreadCount?: number
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Kaprodi / Administrator',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
}

export default function Header({ user, unreadCount = 0 }: HeaderProps) {
  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-border px-6 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Selamat datang di <span className="font-heading font-semibold text-wbi-forest">SIMPRO</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-wbi-gold text-white text-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-auto py-1.5 px-3 rounded-xl hover:bg-wbi-teal/10 transition-colors focus:outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-wbi-teal text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-wbi-forest">{user.fullName}</div>
              <div className="text-xs text-muted-foreground">{roleLabels[user.role] || user.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
