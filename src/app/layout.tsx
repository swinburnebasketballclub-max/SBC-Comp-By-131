import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'

import { LangSwitch } from '@/components/LangSwitch'
import { SignOutButton } from '@/components/SignOutButton'
import { translator } from '@/lib/i18n/server'
import { getViewer } from '@/lib/session'

export const metadata: Metadata = {
  title: {
    default: 'SBC Hub — Swinburne Basketball Club',
    template: '%s · SBC Hub',
  },
  description:
    'Team registration and fixtures for Swinburne Basketball Club competitions.',
  icons: { icon: '/logo.jpg' },
}

export const viewport: Viewport = {
  themeColor: '#08080a',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tr = await translator()
  const viewer = await getViewer()

  return (
    <html lang={tr.locale === 'zh' ? 'zh-Hans' : 'en'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Saira:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <header className="site-head">
          <div className="inner">
            <Link href="/" className="mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="" />
              <span>
                <span className="mark-name">{tr('brand')}</span>
                <span className="mark-sub">{tr('club')}</span>
              </span>
            </Link>

            <div className="row">
              <LangSwitch current={tr.locale} />
              {viewer.kind !== 'anon' && (
                <>
                  <span className="hint">
                    {tr('signedInAs')} <strong style={{ color: 'var(--text-2)' }}>{viewer.email}</strong>
                  </span>
                  <SignOutButton label={tr('signOut')} />
                </>
              )}
            </div>
          </div>
        </header>

        <main className="page">{children}</main>

        <footer className="site-foot">
          <div className="page" style={{ padding: 0 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                Swinburne Basketball Club · President +6011-1419 3067 · Vice President +6011-1060 9962
              </span>
              <span className="row" style={{ gap: 14 }}>
                <Link href="/privacy">{tr('privacy')}</Link>
                <Link href="/terms">{tr('terms')}</Link>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
