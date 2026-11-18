// Idle sign-out. A signed-in browser that has not made a request for IDLE_MINUTES is signed out on the
// server (src/proxy.ts). The open page also signs itself out (IdleGuard), with a shorter limit for admins
// because they can see customer details.
export const SESSION_COOKIE = 'bpc_seen'
export const IDLE_MINUTES = 30
export const ADMIN_IDLE_MINUTES = 15
export const IDLE_MS = IDLE_MINUTES * 60_000
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: IDLE_MINUTES * 60, // the browser drops it at the limit too, so closing the browser for a while ends the session
}
