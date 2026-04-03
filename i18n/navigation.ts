/**
 * i18n/navigation.ts — Locale-aware navigation utilities
 *
 * Creates typed, locale-aware versions of Next.js navigation hooks
 * using the next-intl createNavigation API.  This ensures that all
 * navigation (links, redirects, router pushes) automatically include
 * the current locale prefix in the URL.
 *
 * Exports:
 *   - Link          : drop-in replacement for next/link with locale prefix
 *   - useRouter     : locale-aware version of next/navigation useRouter
 *   - usePathname   : returns the pathname WITHOUT the locale prefix
 *   - useSearchParams : re-exported for convenience alongside the others
 *   - redirect      : locale-aware server-side redirect
 *
 * Usage (client component):
 *   import { useRouter, usePathname } from '@/i18n/navigation'
 *   const router = useRouter()
 *   router.push('/properties')  // automatically adds /en, /tr, etc.
 *
 * Usage (server component / route handler):
 *   import { redirect } from '@/i18n/navigation'
 *   redirect('/contact')
 */

import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Create all locale-aware navigation utilities from the routing config.
 * The routing config defines supported locales and the default locale,
 * ensuring generated URLs always include the correct locale prefix.
 */
export const {
  Link,
  useRouter,
  usePathname,
  redirect,
} = createNavigation(routing)
