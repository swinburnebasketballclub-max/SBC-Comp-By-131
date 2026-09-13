import { redirect } from 'next/navigation'

/** Reviews now happen from the overview table; keep old links working. */
export default function Page() {
  redirect('/admin')
}
