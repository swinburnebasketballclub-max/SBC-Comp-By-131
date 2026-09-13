'use client'

import { useState } from 'react'

/** The list as text, with copy and a real CSV download (this is a live site, not a sandbox). */
export function CopyBlock({
  text, filename, copyLabel, copiedLabel,
}: { text: string; filename: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)

  function download() {
    // BOM so Excel opens the file as UTF-8.
    const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <pre className="code-block">{text}</pre>
      <div className="row">
        <button
          className="btn btn-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(text).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
        >
          {copied ? `✓ ${copiedLabel}` : copyLabel}
        </button>
        <button className="btn" onClick={download}>CSV ↓</button>
      </div>
    </div>
  )
}
