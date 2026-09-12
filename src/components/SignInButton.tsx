'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export function SignInButton({ label, next }: { label: string; next?: string }) {
  const [busy, setBusy] = useState(false)

  async function signIn() {
    setBusy(true)
    const supabase = supabaseBrowser()
    const callback = new URL('/auth/callback', window.location.origin)
    if (next) callback.searchParams.set('next', next)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callback.toString(),
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) setBusy(false)
  }

  return (
    <button className="btn btn-primary" onClick={signIn} disabled={busy}>
      <GoogleMark />
      {label}
    </button>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v7.5h12c-.2 2-1.5 5-4.4 7l6.7 5.2C42.2 36 45 30.6 45 24z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4C29.7 36.6 27.1 37.5 24 37.5c-5.8 0-10.7-3.9-12.5-9.1l-7.1 5.5C8 41.4 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.5 28.4A13.6 13.6 0 0 1 10.8 24c0-1.5.3-3 .7-4.4l-7.1-5.5A22 22 0 0 0 2 24c0 3.5.8 6.9 2.4 9.9z" />
      <path fill="#EA4335" d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.3 29.9 2 24 2 15.4 2 8 6.6 4.4 14.1l7.1 5.5C13.3 14.4 18.2 10.5 24 10.5z" />
    </svg>
  )
}
