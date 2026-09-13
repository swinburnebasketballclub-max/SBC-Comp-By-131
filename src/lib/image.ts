'use client'

/**
 * Shrinks a photo in the browser before upload. A phone camera shot is often
 * 4 MB; a passport photo needs about 600 px. Smaller files upload faster on
 * mobile data and cost less storage.
 */
export async function shrinkImage(file: File, maxEdge = 800, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('NOT_AN_IMAGE')

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('NO_CANVAS')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('ENCODE_FAILED'))), 'image/jpeg', quality),
  )
}

/** Weighted RGB distance — the same formula the database trigger uses. */
export function colourDistance(a: string, b: string): number {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [r1, g1, b1] = rgb(a)
  const [r2, g2, b2] = rgb(b)
  return Math.sqrt(0.55 * (r1! - r2!) ** 2 + 0.7 * (g1! - g2!) ** 2 + 0.35 * (b1! - b2!) ** 2)
}
