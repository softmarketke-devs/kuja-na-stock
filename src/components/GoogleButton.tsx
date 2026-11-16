'use client'

import { signInWithGoogle } from '@/app/actions/auth'
import { ActionForm } from '@/components/ActionForm'

/** "Continue with Google", with an "or" divider above it. */
export function GoogleButton({ note }: { note?: string }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4" aria-hidden>
        <span className="flex-1 h-px bg-[#e2d6bf]" /> or <span className="flex-1 h-px bg-[#e2d6bf]" />
      </div>
      <ActionForm action={signInWithGoogle}>
        <button type="submit" className="w-full min-h-12 inline-flex items-center justify-center gap-3 rounded-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm">
          <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5Z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5Z" />
            <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
          </svg>
          Continue with Google
        </button>
      </ActionForm>
      {note && <p className="text-xs text-slate-500 mt-2">{note}</p>}
    </div>
  )
}
