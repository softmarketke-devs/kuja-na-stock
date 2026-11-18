import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { touchSession } from '@/lib/session'

// Target of the sign-up confirmation email. Handles both the PKCE `code`
// redirect and the `token_hash` template link.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const supabase = await createClient()

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error('Missing confirmation token') }

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirm`)
  }
  await touchSession()
  const next = searchParams.get('next') ?? ''
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard/settings?welcome=1'
  return NextResponse.redirect(`${origin}${safe}`)
}
