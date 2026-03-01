import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('g_auth')?.value
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login')) {
    if (auth) {
      try { JSON.parse(atob(decodeURIComponent(auth))); return NextResponse.redirect(new URL('/', request.url)) }
      catch {}
    }
    return NextResponse.next()
  }

  if (!auth) return NextResponse.redirect(new URL('/login', request.url))
  try { JSON.parse(atob(decodeURIComponent(auth))); return NextResponse.next() }
  catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('g_auth')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
