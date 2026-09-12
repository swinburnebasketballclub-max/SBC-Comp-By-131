import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, t, type Key, type Locale } from './dict'

/** The locale for this request, from the cookie the switch sets. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE
}

/** `const tr = await translator()` then `tr('signIn')`. */
export async function translator() {
  const locale = await getLocale()
  return Object.assign((key: Key) => t(key, locale), { locale })
}
