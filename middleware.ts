import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// BUG-01 FIX: /login with active session → redirect to dashboard (SSR)
// BUG-02 FIX: Strict route separation - authenticated vs public
export function middleware(request: NextRequest) {
  const auth = request.cookies.get('g_auth')?.value
  const { pathname } = request.nextUrl

  // --- PUBLIC ROUTES ---
  // BUG-01: If user already has a valid session and tries to access /login,
  // redirect immediately to dashboard without rendering the login page.
  if (pathname.startsWith('/login')) {
    if (auth) {
      try {
        JSON.parse(atob(decodeURIComponent(auth)))
        // Valid session → redirect away from login
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch {
        // Malformed cookie → allow login page to render
      }
    }
    // No session → allow login
    return NextResponse.next()
  }

  // --- ROOT REDIRECT ---
  // Redirect / to /dashboard for cleaner routing
  if (pathname === '/') {
    if (!auth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // --- PROTECTED ROUTES ---
  // BUG-02: Block ALL app routes if not authenticated
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
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
  // BUG-02: Protect all app routes - /dashboard is now the main authenticated route
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
