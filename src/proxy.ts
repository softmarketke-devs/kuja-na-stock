import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { IDLE_MS, SESSION_COOKIE, cookieOptions } from '@/lib/session-config'

// Refreshes the Supabase session cookie on every page request, signs out idle sessions, and does the
// optimistic auth redirects. Role checks happen in the dashboard pages (requireProfile) and in the
// database functions.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()
  let signedIn = Boolean(data?.claims?.sub)
  const { pathname } = request.nextUrl
  let timedOut = false

  if (signedIn) {
    // The cookie expires after the idle limit, so a missing or old one means the person went away.
    const lastSeen = Number(request.cookies.get(SESSION_COOKIE)?.value ?? 0)
    if (!lastSeen || Date.now() - lastSeen > IDLE_MS) {
      await supabase.auth.signOut()
      signedIn = false
      timedOut = true
    } else {
      response.cookies.set(SESSION_COOKIE, String(Date.now()), cookieOptions)
    }
  }

  const redirectTo = (path: string, search = '') => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = search
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (!signedIn && pathname.startsWith('/dashboard')) {
    const res = redirectTo('/login', timedOut ? '?error=timeout' : `?next=${encodeURIComponent(pathname)}`)
    if (timedOut) res.cookies.delete(SESSION_COOKIE)
    return res
  }
  // A signed-in user with no profile is sent to /login?error=profile; let them see it (and sign out).
  const profileProblem = pathname === '/login' && request.nextUrl.searchParams.get('error') === 'profile'
  if (signedIn && !profileProblem && (pathname === '/login' || pathname === '/signup')) {
    return redirectTo('/dashboard')
  }

  return response
}

// Every page, but not static files, the API routes (cron, voice) or the auth routes, which set their own cookies.
export const config = {
  matcher: ['/((?!api/|auth/|_next/|.*\\..*).*)'],
}
