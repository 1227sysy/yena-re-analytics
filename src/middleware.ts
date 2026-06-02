import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: unknown }) => {
  const isAuth = !!(req as { auth?: unknown }).auth
  const { pathname } = req.nextUrl

  // Auth routes always accessible
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // If Google OAuth not configured, bypass auth
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.next()
  }

  if (!isAuth) {
    const loginUrl = new URL('/api/auth/signin', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
