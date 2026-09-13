'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const TOUR_KEY = 'sbc_tour_seen'

export function TeamNav({
  items, ready, replayLabel,
}: { items: { href: string; label: string }[]; ready: boolean; replayLabel: string }) {
  const path = usePathname()
  const router = useRouter()

  // Until the terms are accepted, everything funnels into setup.
  useEffect(() => {
    if (!ready && path !== '/team/setup') router.replace('/team/setup')
  }, [ready, path, router])

  return (
    <nav className="admin-nav">
      {ready && items.map((item) => {
        const active = item.href === '/team' ? path === '/team' : path.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
            {item.label}
          </Link>
        )
      })}
      {ready && (
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => {
            try { localStorage.removeItem(TOUR_KEY) } catch {}
            router.push('/team?tour=1')
          }}
        >
          ▶ {replayLabel}
        </button>
      )}
    </nav>
  )
}
