'use client';
/**
 * app/[locale]/error.tsx — 500 Error page
 *
 * Error boundary for unhandled server component errors.
 * MUST be a 'use client' component — Next.js requirement for error boundaries.
 *
 * Features:
 * - "Try Again" button to reset the error boundary
 * - Locale-aware "Back to Home" link (preserves /en, /tr, /ru, /ar prefix)
 * - Translated copy via next-intl useTranslations('errors')
 * - Luxury styling consistent with the design system
 *
 * Why next-intl works in a client error boundary:
 *   useTranslations is isomorphic — it reads from the NextIntlClientProvider
 *   installed by the locale layout. No extra setup is needed here.
 *
 * i18n bug fix:
 *   The previous version used a raw <a href="/"> which hard-navigates to the
 *   English root and silently drops the locale. Swapping to the locale-aware
 *   Link from @/i18n/navigation keeps the user on their current locale.
 */

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import styles from './error.module.css'

/**
 * ErrorPage — 500 error boundary component
 *
 * Displays when an unhandled error occurs in a server component.
 * The `error` prop is intentionally not rendered (we never leak internals
 * to the user), but the type signature is kept because Next.js still
 * passes it at runtime and strict mode would flag a mismatched shape.
 *
 * @param reset - Function to reset the error boundary and retry the render
 */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  /* Translations for the shared 'errors' namespace (also used by not-found) */
  const t = useTranslations('errors')

  return (
    <main className={styles.container}>
      {/* Error icon */}
      <div className={styles.icon}>!</div>

      {/* Translated error title — "Server Error" / "Sunucu Hatası" / etc. */}
      <h1 className={styles.title}>{t('serverError')}</h1>

      {/* Translated error description */}
      <p className={styles.text}>{t('serverErrorText')}</p>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Action buttons */}
      <div className={styles.buttons}>
        {/* Try Again button — resets the error boundary */}
        <button onClick={reset} className={styles.tryAgain}>
          {t('tryAgain')}
        </button>

        {/* Locale-aware "Back to Home" link */}
        <Link href="/" className={styles.homeLink}>
          {t('backToHome')}
        </Link>
      </div>
    </main>
  )
}
