'use client';
/**
 * app/[locale]/error.tsx — 500 Error page
 *
 * Error boundary for unhandled server component errors.
 * MUST be a 'use client' component — Next.js requirement for error boundaries.
 *
 * Features:
 * - "Try Again" button to reset the error boundary
 * - "Go Home" link to navigate back to the homepage
 * - Luxury styling consistent with the design system
 */

'use client'

import styles from './error.module.css'

/**
 * ErrorPage — 500 error boundary component
 * Displays when an unhandled error occurs in a server component
 *
 * @param error - The error that was thrown
 * @param reset - Function to reset the error boundary and retry
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className={styles.container}>
      {/* Error icon */}
      <div className={styles.icon}>!</div>

      {/* Error title */}
      <h1 className={styles.title}>Something went wrong</h1>

      {/* Error description */}
      <p className={styles.text}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>

      {/* Gold divider */}
      <div className={styles.divider} />

      {/* Action buttons */}
      <div className={styles.buttons}>
        {/* Try Again button — resets the error boundary */}
        <button onClick={reset} className={styles.tryAgain}>
          Try Again
        </button>

        {/* Go Home link */}
        <a href="/" className={styles.homeLink}>
          Go Home
        </a>
      </div>
    </main>
  )
}
