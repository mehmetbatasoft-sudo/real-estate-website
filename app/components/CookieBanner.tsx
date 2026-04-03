'use client';
/**
 * CookieBanner.tsx — Cookie consent banner for Ozgul's Realty
 *
 * A client-side cookie consent banner that appears at the bottom of the
 * screen when a visitor has not yet accepted or declined cookies.  The
 * banner persists consent decisions in localStorage so it only shows once
 * per browser.
 *
 * Features:
 *   - Fully translated via next-intl (namespace: 'cookies')
 *   - Hydration-safe rendering via useEffect + setTimeout(0) pattern
 *   - Accept / Decline buttons that store the decision in localStorage
 *   - "Learn More" link to the /cookies policy page
 *   - Fixed position at the bottom of the viewport
 *   - Luxury design: espresso background, ivory text, gold accents
 *   - Responsive: stacks vertically on mobile
 *
 * How hydration safety works:
 *   React server-renders with `visible = false`.  On the client, a
 *   useEffect fires after hydration and (via setTimeout(0)) defers the
 *   localStorage read and banner display to the next microtask.  This
 *   guarantees the server HTML and the initial client render match,
 *   avoiding the dreaded "hydration mismatch" error.
 *
 * Usage:
 *   // Typically placed in the root layout so it's globally available
 *   <CookieBanner />
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import styles from './CookieBanner.module.css'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/**
 * The localStorage key used to persist the visitor's cookie consent
 * decision.  Values: 'accepted' | 'declined' | (absent = not decided).
 */
const CONSENT_KEY = 'cookieConsent'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * CookieBanner
 *
 * Renders a fixed-position banner at the bottom of the viewport that
 * asks the visitor to accept or decline cookies.  Hidden when the
 * visitor has already made a choice (persisted in localStorage).
 *
 * @returns A banner element or null when consent has already been given.
 */
const CookieBanner: React.FC = () => {
  /* ---- i18n -------------------------------------------------------- */

  /** Translation function scoped to the 'cookies' namespace */
  const t = useTranslations('cookies')

  /* ---- State ------------------------------------------------------- */

  /**
   * visible — whether the banner is currently shown.
   * Starts as false so the server-rendered HTML never includes the banner,
   * preventing hydration mismatches.
   */
  const [visible, setVisible] = useState<boolean>(false)

  /* ---- Effects ----------------------------------------------------- */

  /**
   * Check localStorage for existing consent on mount.
   *
   * The setTimeout(0) wrapper defers the localStorage read to the next
   * event-loop tick AFTER React's hydration is complete.  This is critical:
   * without it, setting `visible = true` during the first render pass
   * would cause a mismatch between the server HTML (banner absent) and
   * the client render (banner present).
   *
   * Flow:
   *   1. Server renders with visible=false (no banner in HTML).
   *   2. Client hydrates — initial render matches server (visible=false).
   *   3. useEffect fires after hydration.
   *   4. setTimeout(0) pushes the localStorage check to the next tick.
   *   5. If no consent found, setVisible(true) triggers a client-only
   *      re-render that adds the banner to the DOM.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      /* Read the stored consent value — null means not yet decided */
      const consent = localStorage.getItem(CONSENT_KEY)

      /* Show the banner only if the visitor hasn't decided yet */
      if (!consent) {
        setVisible(true)
      }
    }, 0)

    /* Cleanup the timer if the component unmounts before it fires */
    return () => clearTimeout(timer)
  }, [])

  /* ---- Handlers ---------------------------------------------------- */

  /**
   * handleAccept — called when the visitor clicks "Accept".
   * Stores the 'accepted' value in localStorage and hides the banner.
   */
  const handleAccept = (): void => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  /**
   * handleDecline — called when the visitor clicks "Decline".
   * Stores the 'declined' value in localStorage and hides the banner.
   * The site should respect this by not setting non-essential cookies.
   */
  const handleDecline = (): void => {
    localStorage.setItem(CONSENT_KEY, 'declined')
    setVisible(false)
  }

  /* ---- Early return ------------------------------------------------ */

  /**
   * Don't render anything when the banner should not be visible.
   * This covers: server render, initial hydration, and post-consent state.
   */
  if (!visible) {
    return null
  }

  /* ---- Render ------------------------------------------------------ */

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent">
      {/*
       * Banner text — describes cookie usage with a "Learn More" link
       * to the full cookie policy page.
       */}
      <p className={styles.text}>
        {t('message')}{' '}
        <Link href="/cookies" className={styles.learnMore}>
          {t('learnMore')}
        </Link>
      </p>

      {/*
       * Action buttons — Accept and Decline.
       * Accept is the primary action (gold filled button).
       * Decline is secondary (transparent with gold border).
       */}
      <div className={styles.buttons}>
        {/* Accept button — stores consent and hides banner */}
        <button
          type="button"
          onClick={handleAccept}
          className={styles.acceptButton}
        >
          {t('accept')}
        </button>

        {/* Decline button — stores rejection and hides banner */}
        <button
          type="button"
          onClick={handleDecline}
          className={styles.declineButton}
        >
          {t('decline')}
        </button>
      </div>
    </div>
  )
}

export default CookieBanner
