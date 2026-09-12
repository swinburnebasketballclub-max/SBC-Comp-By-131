'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      className="btn btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await supabaseBrowser().auth.signOut()
        router.push('/')
        router.refresh()
      }}
    >
      {label}
    </button>
  )
}
