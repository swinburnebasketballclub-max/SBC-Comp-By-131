'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/dict'

/**
 * EN / 中 switch. Writes a cookie and refreshes, so the choice survives a
 * reload and applies to server-rendered pages too.
 */
export function LangSwitch({ current }: { current: Locale }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function choose(next: Locale) {
    if (next === current) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    start(() => router.refresh())
  }

  return (
    <div className="lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={current === 'en'} onClick={() => choose('en')} disabled={pending}>
        EN
      </button>
      <button type="button" aria-pressed={current === 'zh'} onClick={() => choose('zh')} disabled={pending}>
        中文
      </button>
    </div>
  )
}
