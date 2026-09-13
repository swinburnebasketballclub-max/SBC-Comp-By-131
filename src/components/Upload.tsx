'use client'

import { useId, useRef, useState } from 'react'

import { shrinkImage } from '@/lib/image'
import { supabaseBrowser } from '@/lib/supabase/client'

type Props = {
  bucket: 'photos' | 'receipts' | 'team-logos' | 'jersey-designs'
  /** Folder inside the bucket, always `teams/<team_id>/...` so storage policies apply. */
  folder: string
  accept?: string
  label: string
  replaceLabel: string
  hint?: string
  previewUrl?: string | null
  shape?: 'square' | 'portrait' | 'wide'
  maxEdge?: number
  onUploaded: (path: string, previewUrl: string) => void
  failedText: string
  uploadingText: string
}

/**
 * Upload for signed-in managers. Images are shrunk in the browser first —
 * a phone photo drops from several megabytes to a couple of hundred
 * kilobytes, which matters on mobile data in a sports hall.
 */
export function Upload({
  bucket, folder, accept = 'image/*', label, replaceLabel, hint, previewUrl,
  shape = 'square', maxEdge = 1000, onUploaded, failedText, uploadingText,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  async function pick(file: File) {
    setBusy(true)
    setFailed(false)
    try {
      const isImage = file.type.startsWith('image/') && file.type !== 'image/svg+xml'
      const body: Blob = isImage ? await shrinkImage(file, maxEdge) : file
      const ext = isImage ? 'jpg' : (file.name.split('.').pop() ?? 'bin').toLowerCase()
      const path = `${folder}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabaseBrowser()
        .storage.from(bucket)
        .upload(path, body, { contentType: isImage ? 'image/jpeg' : file.type, upsert: false })
      if (error) throw error

      const local = URL.createObjectURL(body)
      setPreview(isImage ? local : null)
      setFileName(file.name)
      onUploaded(path, local)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`upload upload-${shape}`}>
      <label htmlFor={id} className="upload-box">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span className="upload-plus" aria-hidden>{busy ? '…' : '＋'}</span>
        )}
      </label>
      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
        <button type="button" className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? uploadingText : preview || fileName ? replaceLabel : label}
        </button>
        {fileName && !preview && <span className="sub num">{fileName}</span>}
        {hint && <span className="hint">{hint}</span>}
        {failed && <span className="hint bad">{failedText}</span>}
      </div>
      <input
        id={id}
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void pick(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
