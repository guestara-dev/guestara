import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('g_auth')?.value
  const { pathname } = request.nextUrl

  // Always allow login page and public assets
  if (pathname.startsWith('/login')) {
    if (auth) {
      try {
        JSON.parse(atob(decodeURIComponent(auth)))
        return NextResponse.redirect(new URL('/', request.url))
      } catch {}
    }
    return NextResponse.next()
  }

  // Block all other routes if not authenticated
  if (!auth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const user = JSON.parse(atob(decodeURIComponent(auth)))

    // Admin-only routes
    const adminRoutes = ['/setup', '/configuracion']
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

    if (isAdminRoute && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  } catch {
    // Cookie exists but is malformed — clear it and redirect to login
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('g_auth')
    return res
  }
}

export const config = {
  // Protect all routes except login, api, static assets
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico).*)'],
}
