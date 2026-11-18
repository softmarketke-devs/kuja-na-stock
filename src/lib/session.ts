import 'server-only'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, cookieOptions } from './session-config'

/** Marks "the user is active now". Call it right after any sign-in so the idle check starts fresh. */
export async function touchSession() {
  ;(await cookies()).set(SESSION_COOKIE, String(Date.now()), cookieOptions)
}
