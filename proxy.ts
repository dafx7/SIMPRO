import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAuthPage = nextUrl.pathname.startsWith('/login')
  const isDashboardPage =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/proposals') ||
    nextUrl.pathname.startsWith('/reviews') ||
    nextUrl.pathname.startsWith('/admin') ||
    nextUrl.pathname.startsWith('/notifications')

  if (isAuthPage) {
    if (isLoggedIn) {
      const role = session?.user?.role
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin/proposals', nextUrl))
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
}
