'use client';
/**
 * app/[locale]/nmo-bbo-141522/login/page.tsx — Admin Login Page
 *
 * Client component that renders the admin login form.
 * All UI text is in Turkish since the admin panel is Turkish-only.
 *
 * Authentication flow:
 * 1. Admin enters email and password
 * 2. signIn('credentials', ...) sends credentials to NextAuth
 * 3. NextAuth's authorize() function checks against the Admin table
 * 4. On success: redirect to admin dashboard via router.push()
 * 5. On failure: show Turkish error message "E-posta veya sifre hatali"
 *
 * Uses next-auth/react's signIn() with redirect: false to handle
 * errors in-component (instead of redirecting to an error page).
 *
 * Styled with login.module.css — luxury aesthetic with gold accents.
 *
 * Route: /[locale]/nmo-bbo-141522/login
 */

'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import styles from './login.module.css'

/**
 * AdminLoginPage — renders the Turkish-only admin login form
 * Manages form state (email, password), loading state, and error state
 */
export default function AdminLoginPage() {
  /* Form field state — controlled inputs */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  /* Error state — shows Turkish error message when credentials are invalid */
  const [error, setError] = useState('')

  /* Loading state — disables form during authentication */
  const [isLoading, setIsLoading] = useState(false)

  /* Router for programmatic navigation after successful login */
  const router = useRouter()

  /* Get the current locale from URL params for redirect path */
  const params = useParams()
  const locale = params.locale as string

  /**
   * Handle form submission
   * Calls signIn with credentials provider, handles success/failure
   */
  async function handleSubmit(e: FormEvent) {
    /* Prevent default form submission (page reload) */
    e.preventDefault()

    /* Clear any previous error messages */
    setError('')

    /* Set loading state to disable form and show loading indicator */
    setIsLoading(true)

    try {
      /**
       * Call NextAuth's signIn with credentials
       * redirect: false — handle the result in code instead of auto-redirecting
       * This allows us to show error messages in the UI
       */
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      /**
       * Check the result — signIn returns { ok, error } when redirect: false
       * ok: true = successful authentication
       * error: string = authentication failed (wrong credentials)
       */
      if (result?.error) {
        /* Show Turkish error message for invalid credentials */
        setError('E-posta veya şifre hatalı')
      } else {
        /* Success — redirect to admin dashboard */
        router.push(`/${locale}/nmo-bbo-141522`)
      }
    } catch {
      /* Catch network errors or unexpected failures */
      setError('E-posta veya şifre hatalı')
    } finally {
      /* Always reset loading state regardless of outcome */
      setIsLoading(false)
    }
  }

  return (
    /* Full-screen centered login container */
    <div className={styles.container}>
      {/* Login card — centered box with form */}
      <div className={styles.card}>
        {/* Turkish title — "Giris Yap" means "Sign In" */}
        <h1 className={styles.title}>Giriş Yap</h1>

        {/* Subtitle — brand name for context */}
        <p className={styles.subtitle}>Özgül&apos;s Realty Admin</p>

        {/* Login form — onSubmit calls handleSubmit */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email field group */}
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="admin@ozgulsrealty.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password field group */}
          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="********"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Error message — only shown when error state is set */}
          {error && (
            <p className={styles.error}>
              {error}
            </p>
          )}

          {/* Submit button — "Giris" means "Sign In" */}
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {/* Show loading text while authenticating */}
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş'}
          </button>
        </form>
      </div>
    </div>
  )
}
