import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0] // e.g., "verify.circuitcrate.in" or "localhost"
  const pathname = url.pathname

  // Determine subdomain and baseDomain dynamically
  let subdomain = ''
  let baseDomain = hostname

  if (hostname.includes('.')) {
    const parts = hostname.split('.')
    const firstPart = parts[0].toLowerCase()
    if (firstPart === 'verify' || firstPart === 'admin') {
      subdomain = firstPart
      // Extract the rest as the base domain (e.g., "verify.example.com" -> "example.com")
      baseDomain = parts.slice(1).join('.')
    }
  }

  // 1. Handle verify subdomain
  if (subdomain === 'verify') {
    // If accessing admin routes on verify subdomain, redirect to admin subdomain dynamically
    if (pathname.startsWith('/admin')) {
      const adminUrl = new URL(pathname + url.search, request.url)
      adminUrl.hostname = `admin.${baseDomain}`
      return NextResponse.redirect(adminUrl)
    }

    // Rewrite root path to /verify under the hood (browser URL stays as "/")
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/verify', request.url))
    }

    // Redirect direct /verify requests to / (clean URL)
    if (pathname === '/verify') {
      const cleanUrl = new URL('/', request.url)
      cleanUrl.search = url.search
      return NextResponse.redirect(cleanUrl)
    }
  }

  // 2. Handle admin subdomain
  if (subdomain === 'admin') {
    // If accessing verify or certificate pages on admin subdomain, redirect to verify subdomain dynamically
    if (pathname === '/verify' || pathname.startsWith('/certificate')) {
      const verifyUrl = new URL(pathname === '/verify' ? '/' : pathname + url.search, request.url)
      verifyUrl.hostname = `verify.${baseDomain}`
      return NextResponse.redirect(verifyUrl)
    }

    // Redirect root to /admin/dashboard
    if (pathname === '/') {
      const adminDashboard = new URL('/admin/dashboard', request.url)
      return NextResponse.redirect(adminDashboard)
    }
  }

  // 3. For main domain or apex domain (enforce subdomain-only access)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  if (!isLocalhost && !subdomain) {
    if (pathname.startsWith('/admin')) {
      const adminUrl = new URL(pathname + url.search, request.url)
      adminUrl.hostname = `admin.${baseDomain}`
      return NextResponse.redirect(adminUrl)
    } else {
      const verifyUrl = new URL(pathname === '/verify' ? '/' : pathname + url.search, request.url)
      verifyUrl.hostname = `verify.${baseDomain}`
      return NextResponse.redirect(verifyUrl)
    }
  }

  // Run Supabase session update (handles session refresh and path authorization)
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
