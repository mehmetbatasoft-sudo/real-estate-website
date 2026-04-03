/**
 * app/[locale]/not-found.tsx — 404 Not Found page
 *
 * Displayed when a user navigates to a URL that doesn't match any route,
 * or when notFound() is called from a server component.
 *
 * Features:
 * - Luxury styling consistent with the design system
 * - Translated text using next-intl
 * - "Back to Homepage" link
 * - Server component — no client-side JavaScript needed
 */

import { useTranslations } from 'next-intl'
import styles from './not-found.module.css'
import { Link } from '@/i18n/navigation'

/**
 * NotFoundPage — 404 error page with luxury styling
 * Shows translated "page not found" message and navigation back to home
 */
export default function NotFoundPage() {
  /* Get translations for the errors namespace */
  const t = useTranslations('errors')

  return (
    <main className={styles.container}>
      {/* Large 404 heading */}
      <h1 className={styles.errorCode}>404</h1>

      {/* Translated error title */}
      <h2 className={styles.title}>{t('notFound')}</h2>

      {/* Translated error description */}
      <p className={styles.text}>{t('notFoundText')}</p>

      {/* Gold divider line */}
      <div className={styles.divider} />

      {/* Link back to homepage */}
      <Link href="/" className={styles.homeLink}>
        {t('backToHome')}
      </Link>
    </main>
  )
}
