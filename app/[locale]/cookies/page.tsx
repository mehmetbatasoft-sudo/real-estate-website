/**
 * app/[locale]/cookies/page.tsx -- Cookie Policy page for Ozgul's Realty
 *
 * This SERVER component displays the website's cookie policy, explaining
 * what cookies are, which cookies the site uses, and providing a detailed
 * inventory table of each cookie with its name, purpose, and duration.
 *
 * Page structure (3 sections):
 *
 *   1. What Are Cookies  -- Brief explanation of cookie technology for
 *                           non-technical visitors.
 *
 *   2. Cookies We Use    -- Description of the site's minimal cookie usage
 *                           (essential only, no tracking or advertising),
 *                           followed by a 3-column inventory table:
 *                             - Login Session (next-auth.session-token)
 *                             - Language Preference (NEXT_LOCALE)
 *
 *   3. Contact           -- How to reach the data controller for cookie-
 *                           related questions.
 *
 * Cookie inventory:
 *   +---------------------------------+----------------------------------+-----------+
 *   | Cookie Name                     | Purpose                          | Duration  |
 *   +---------------------------------+----------------------------------+-----------+
 *   | next-auth.session-token         | Login session (admin panel)       | Session   |
 *   | NEXT_LOCALE                     | Language preference               | Session   |
 *   +---------------------------------+----------------------------------+-----------+
 *
 * Compliance:
 *   This page satisfies transparency requirements under:
 *   - KVKK (Turkish Law No. 6698) -- Article 10 disclosure obligation
 *   - GDPR (EU Regulation 2016/679) -- Article 13 information requirement
 *   - ePrivacy Directive (2002/58/EC) -- Cookie consent transparency
 *
 * Translations:
 *   - All UI labels and descriptions come from the 'cookies' namespace
 *     in messages/*.json via next-intl getTranslations.
 *
 * Layout components (Navbar, SmoothScroll, CookieBanner) are rendered here
 * because they are NOT in the locale layout (admin pages need to omit them).
 *
 * Styling: All styles via CSS Modules (cookies.module.css). Zero inline styles.
 */

import { getTranslations } from 'next-intl/server'

/* -- Layout components (rendered on public pages, not admin) -- */
import Navbar from '@/app/components/Navbar'
import SmoothScroll from '@/app/components/SmoothScroll'
import CookieBanner from '@/app/components/CookieBanner'

/* -- CSS Module -- */
import styles from './cookies.module.css'

/**
 * Generate metadata for the Cookie Policy page.
 * Sets the page title for SEO and the browser tab using the
 * translated 'cookies.title' string from messages/*.json.
 */
export async function generateMetadata() {
  const t = await getTranslations('cookies')
  return {
    title: t('title'),
  }
}

/**
 * CookiesPage -- the cookie policy page server component
 *
 * Loads translations for the 'cookies' namespace and renders a
 * comprehensive cookie policy with an inventory table listing
 * every cookie the website uses, its purpose, and its duration.
 *
 * @returns The fully rendered Cookie Policy page JSX
 */
export default async function CookiesPage() {
  /* ------------------------------------------------------------------ */
  /*  Translations                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Load the translation function for the 'cookies' namespace.
   * Used for all labels, descriptions, and table content on this page.
   * Server-side only -- no client bundle cost.
   */
  const t = await getTranslations('cookies')

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <>
      {/* ============================================================
          Global layout components
          Navbar: fixed top navigation with scroll-based transparency
          SmoothScroll: Lenis smooth scrolling (renders no visible UI)
          CookieBanner: GDPR/KVKK consent banner (shows once per visitor)
          ============================================================ */}
      <Navbar />
      <SmoothScroll />
      <CookieBanner />

      <main className={styles.page}>
        {/* ============================================================
            PAGE HEADER
            Centered title and subtitle introducing the cookie policy.
            Uses a narrower max-width (800px) for comfortable reading.
            ============================================================ */}
        <header className={styles.header}>
          {/* Page title -- translated per locale */}
          <h1 className={styles.title}>{t('title')}</h1>

          {/* Subtitle -- translated per locale */}
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </header>

        {/* ============================================================
            COOKIE POLICY CONTENT
            Three sections separated by thin gold bottom borders:
            1. What cookies are (educational)
            2. Cookie inventory table (transparency)
            3. Contact information (accountability)
            ============================================================ */}
        <div className={styles.content}>
          {/* ============================================================
              SECTION 1: WHAT ARE COOKIES
              A brief, non-technical explanation of cookie technology
              for visitors who may not be familiar with the concept.
              Uses the translated 'whatAreCookies' key as the heading
              and provides a plain-language description.
              ============================================================ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('whatAreCookies')}</h2>
            <p className={styles.text}>
              {/*
                * Explanation text: Cookies are small text files that websites
                * store on a visitor's device (computer, phone, tablet) to
                * remember preferences and improve the browsing experience.
                * This text is intentionally simple and jargon-free.
                */}
              Cookies are small text files stored on your device when you visit
              a website. They help the website remember your preferences and
              improve your overall browsing experience. Cookies do not contain
              personal information unless you have explicitly provided it through
              a form on the website.
            </p>
          </section>

          {/* ============================================================
              SECTION 2: COOKIES WE USE
              Lists all cookies used by the website with a description
              of the site's minimal, essential-only approach to cookies.
              Contains the cookie inventory table with 3 columns.
              ============================================================ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('cookiesWeUse')}</h2>

            {/* Introductory text explaining the minimal cookie approach */}
            <p className={styles.text}>
              {/*
                * This website only uses essential cookies required for core
                * functionality. We do not use tracking cookies, analytics
                * cookies, or advertising cookies. Your privacy is important
                * to us, and we minimize data collection to what is strictly
                * necessary for the website to function.
                */}
              We only use essential cookies that are strictly necessary for the
              website to function. We do not use any tracking, analytics, or
              advertising cookies. The table below lists every cookie used on
              this website.
            </p>

            {/* --------------------------------------------------------
                COOKIE INVENTORY TABLE
                A 3-column table listing every cookie used on the site:
                  Column 1: Cookie Name (technical identifier)
                  Column 2: Purpose (what the cookie does)
                  Column 3: Duration (how long the cookie persists)

                Currently 2 rows:
                  1. next-auth.session-token -- admin login session
                  2. NEXT_LOCALE -- language preference
                -------------------------------------------------------- */}
            <table className={styles.table}>
              {/* Table header row with translated column labels */}
              <thead>
                <tr>
                  {/* Column 1 header: Cookie Name */}
                  <th className={styles.tableHeader}>{t('cookieName')}</th>
                  {/* Column 2 header: Purpose */}
                  <th className={styles.tableHeader}>{t('purpose')}</th>
                  {/* Column 3 header: Duration */}
                  <th className={styles.tableHeader}>{t('duration')}</th>
                </tr>
              </thead>

              <tbody>
                {/* --------------------------------------------------------
                    ROW 1: LOGIN SESSION COOKIE
                    Technical name: next-auth.session-token
                    Set by: NextAuth.js authentication library
                    Purpose: Maintains the admin's authenticated session so
                             they stay logged in while navigating the admin
                             panel. This cookie is NOT set for public visitors
                             -- only for admin panel users.
                    Duration: Session (expires when the browser is closed)
                    -------------------------------------------------------- */}
                <tr>
                  {/* Cookie technical name */}
                  <td className={styles.cookieName}>next-auth.session-token</td>
                  {/* Translated purpose description */}
                  <td className={styles.tableCell}>{t('loginSessionDesc')}</td>
                  {/* Duration -- "Session" (translated) */}
                  <td className={styles.tableCell}>{t('session')}</td>
                </tr>

                {/* --------------------------------------------------------
                    ROW 2: LANGUAGE PREFERENCE COOKIE
                    Technical name: NEXT_LOCALE
                    Set by: next-intl internationalization library
                    Purpose: Remembers the visitor's selected language so
                             they don't have to choose it every time they
                             visit. Stores a locale code like 'en', 'tr',
                             'ru', or 'ar'.
                    Duration: Session (expires when the browser is closed)
                    -------------------------------------------------------- */}
                <tr>
                  {/* Cookie technical name */}
                  <td className={styles.cookieName}>NEXT_LOCALE</td>
                  {/* Translated purpose description */}
                  <td className={styles.tableCell}>{t('languagePrefDesc')}</td>
                  {/* Duration -- "Session" (translated) */}
                  <td className={styles.tableCell}>{t('session')}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ============================================================
              SECTION 3: CONTACT
              Provides contact information for cookie-related questions.
              Required by GDPR Article 13 and KVKK Article 10 for
              transparency about who to contact regarding data practices.
              ============================================================ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('contact')}</h2>
            <p className={styles.text}>
              {/*
                * Contact information for cookie-related inquiries.
                * Directs visitors to the data controller's email address.
                */}
              For any questions about our use of cookies or to exercise your
              rights regarding cookie data, please contact us at
              ozgul.oriva@gmail.com. You can also manage your cookie preferences
              by adjusting your browser settings at any time.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
