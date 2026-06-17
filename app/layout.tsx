import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading', weight: ['600', '700', '800'] })

export const metadata: Metadata = {
  title: 'SIMPRO - Sistem Informasi Manajemen Proposal Penelitian',
  description: 'Politeknik Wilmar Bisnis Indonesia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
