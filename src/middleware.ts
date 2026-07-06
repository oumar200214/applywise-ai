import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/new-application',
  '/applications',
  '/generating',
  '/onboarding',
  '/tracker',
  '/settings',
  '/interview-prep',
  '/skill-gap',
]

// Routes only for unauthenticated users
const AUTH_ROUTES = ['/auth']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not remove
  let user = null
  let supabaseUnreachable = false
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Supabase unreachable (project paused, network issue, etc.)
    // Must return early — do NOT fall through with user=null or protected routes get blocked
    supabaseUnreachable = true
    console.warn('[Middleware] Supabase unreachable, skipping auth check')
  }

  // If Supabase is down, allow request unconditionally — client pages handle their own auth
  if (supabaseUnreachable) return supabaseResponse

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users from protected routes to /auth
  const isProtected = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from /auth to /dashboard
  const isAuthRoute = AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (let them handle their own auth)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
