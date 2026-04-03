/**
 * app/[locale]/privacy/page.tsx -- Privacy Policy page for Ozgul's Realty
 *
 * This SERVER component displays the full privacy policy for the website,
 * covering both Turkish (KVKK) and European (GDPR) data protection
 * regulations. The page is styled with the luxury aesthetic matching
 * the rest of the site.
 *
 * Page structure (7 sections within 2 regulation blocks):
 *
 *   KVKK Compliance Block:
 *     1. Data Controller     -- Identity and contact info of the data controller
 *     2. Data Collected      -- Types of personal data gathered (contact form fields)
 *     3. Purpose of Processing -- Why data is collected and how it is used
 *     4. Legal Basis         -- Lawful grounds for processing personal data
 *
 *   GDPR Compliance Block:
 *     5. Data Retention      -- How long personal data is stored
 *     6. Your Rights         -- Data subject rights (access, rectification, erasure, etc.)
 *     7. Contact             -- How to reach the data controller for privacy inquiries
 *
 * Translations:
 *   - All static UI labels come from the 'privacy' namespace in messages/*.json
 *   - Substantive legal text is hardcoded in English because legal documents
 *     must be precise and are maintained by the site owner, not auto-translated.
 *
 * Layout components (Navbar, SmoothScroll, CookieBanner) are rendered here
 * because they are NOT in the locale layout (admin pages need to omit them).
 *
 * Styling: All styles via CSS Modules (privacy.module.css). Zero inline styles.
 */

import { getTranslations } from 'next-intl/server'

/* -- Layout components (rendered on public pages, not admin) -- */
import Navbar from '@/app/components/Navbar'
import SmoothScroll from '@/app/components/SmoothScroll'
import CookieBanner from '@/app/components/CookieBanner'

/* -- CSS Module -- */
import styles from './privacy.module.css'

/**
 * Generate metadata for the Privacy Policy page.
 * Sets the page title for SEO and the browser tab using the
 * translated 'privacy.title' string from messages/*.json.
 */
export async function generateMetadata() {
  const t = await getTranslations('privacy')
  return {
    title: t('title'),
  }
}

/**
 * PrivacyPage -- the full privacy policy page server component
 *
 * Loads translations for the 'privacy' namespace and renders a
 * comprehensive privacy policy covering KVKK and GDPR compliance.
 * Each section is rendered as a visually distinct card with an
 * ivory background and gold accent borders.
 *
 * @returns The fully rendered Privacy Policy page JSX
 */
export default async function PrivacyPage() {
  /* ------------------------------------------------------------------ */
  /*  Translations                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Load the translation function for the 'privacy' namespace.
   * Used for section headings and labels throughout the page.
   * Server-side only -- no client bundle cost.
   */
  const t = await getTranslations('privacy')

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
            Centered title and subtitle introducing the privacy policy.
            Uses a narrower max-width for comfortable reading of legal
            text (800px vs the site-wide 1280px).
            ============================================================ */}
        <header className={styles.header}>
          {/* Page title -- translated per locale */}
          <h1 className={styles.title}>{t('title')}</h1>

          {/* Subtitle -- translated per locale */}
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </header>

        {/* ============================================================
            PRIVACY POLICY CONTENT
            All sections are rendered as ivory cards with gold borders.
            The content is split into KVKK (Turkish law) and GDPR
            (European regulation) compliance blocks.
            ============================================================ */}
        <div className={styles.content}>
          {/* --------------------------------------------------------
              SECTION 1: DATA CONTROLLER
              Identifies who is responsible for processing personal data.
              This is required by both KVKK Article 10 and GDPR Article 13.
              -------------------------------------------------------- */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('dataController')}</h2>
            <div className={styles.item}>
              <p className={styles.itemText}>
                {/* Data controller identity -- the agent/business owner */}
                Ozgul Peksen — Luxury Real Estate Consultant
              </p>
              <p className={styles.itemText}>
                {/* Physical address for legal correspondence */}
                Antalya, Turkey
              </p>
              <p className={styles.itemText}>
                {/* Contact email for data protection inquiries */}
                ozgul.oriva@gmail.com
              </p>
            </div>
          </section>

          {/* ============================================================
              KVKK COMPLIANCE BLOCK
              The Turkish Personal Data Protection Law (KVKK, Law No. 6698)
              requires transparency about data collection and processing.
              ============================================================ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('kvkkTitle')}</h2>

            {/* --------------------------------------------------------
                DATA COLLECTED
                Lists all categories of personal data that the website
                collects from visitors through the contact form.
                Required by KVKK Article 10(c).
                -------------------------------------------------------- */}
            <div className={styles.item}>
              <h3 className={styles.itemLabel}>{t('dataCollected')}</h3>
              <ul className={styles.list}>
                {/* Name, email, phone are collected via the contact form */}
                <li>Full name, email address, and phone number (submitted via the contact form)</li>
                {/* Property inquiry details link the message to a specific listing */}
                <li>Property inquiry details (which listing the visitor is asking about)</li>
                {/* Language preference is stored as a cookie (NEXT_LOCALE) */}
                <li>Language preference (stored as a browser cookie)</li>
              </ul>
            </div>

            {/* --------------------------------------------------------
                PURPOSE OF PROCESSING
                Explains why the collected data is processed.
                Required by KVKK Article 10(b) and GDPR Article 13(1)(c).
                -------------------------------------------------------- */}
            <div className={styles.item}>
              <h3 className={styles.itemLabel}>{t('purposeOfProcessing')}</h3>
              <p className={styles.itemText}>
                Personal data is collected and processed solely for the purpose of
                responding to real estate inquiries submitted through the contact form.
                Your information is used to contact you regarding the properties you
                have expressed interest in and to provide the requested real estate
                consultation services. We do not use your data for marketing purposes
                unless you explicitly consent.
              </p>
            </div>

            {/* --------------------------------------------------------
                LEGAL BASIS
                The lawful grounds under which personal data is processed.
                Required by KVKK Article 5 and GDPR Article 6.
                -------------------------------------------------------- */}
            <div className={styles.item}>
              <h3 className={styles.itemLabel}>{t('legalBasis')}</h3>
              <p className={styles.itemText}>
                Processing of contact form data is based on legitimate interest
                (KVKK Article 5(2)(f) and GDPR Article 6(1)(f)) — specifically,
                the legitimate interest of responding to visitor inquiries about
                real estate listings. Cookie preferences are processed based on
                your explicit consent (KVKK Article 5(1) and GDPR Article 6(1)(a)).
              </p>
            </div>
          </section>

          {/* ============================================================
              GDPR COMPLIANCE BLOCK
              The EU General Data Protection Regulation applies to visitors
              from the European Economic Area. Even though the business is
              based in Turkey, GDPR applies when services are offered to
              EU residents (GDPR Article 3(2)).
              ============================================================ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('gdprTitle')}</h2>

            {/* --------------------------------------------------------
                DATA RETENTION
                How long personal data is stored before deletion.
                Required by GDPR Article 13(2)(a).
                -------------------------------------------------------- */}
            <div className={styles.item}>
              <h3 className={styles.itemLabel}>{t('dataRetention')}</h3>
              <p className={styles.itemText}>
                Contact form submissions (name, email, phone, message) are retained
                for a maximum of 2 years from the date of submission, or until you
                request deletion — whichever comes first. Session cookies expire
                automatically when you close your browser. The language preference
                cookie (NEXT_LOCALE) persists until you clear your browser cookies
                or change your language selection.
              </p>
            </div>

            {/* --------------------------------------------------------
                YOUR RIGHTS
                Lists all data subject rights under both KVKK and GDPR.
                Required by KVKK Article 11 and GDPR Articles 15-22.
                -------------------------------------------------------- */}
            <div className={styles.item}>
              <h3 className={styles.itemLabel}>{t('yourRights')}</h3>
              <p className={styles.itemText}>
                Under KVKK and GDPR, you have the following rights regarding your personal data:
              </p>
              <ul className={styles.list}>
                {/* Right of access -- KVKK Art. 11(b), GDPR Art. 15 */}
                <li>Right to access your personal data and obtain a copy</li>
                {/* Right to rectification -- KVKK Art. 11(d), GDPR Art. 16 */}
                <li>Right to rectification of inaccurate or incomplete data</li>
                {/* Right to erasure -- KVKK Art. 11(e), GDPR Art. 17 */}
                <li>Right to erasure ("right to be forgotten")</li>
                {/* Right to data portability -- GDPR Art. 20 */}
                <li>Right to data portability in a structured, machine-readable format</li>
                {/* Right to object -- KVKK Art. 11(e), GDPR Art. 21 */}
                <li>Right to object to processing of your personal data</li>
                {/* Right to restriction -- GDPR Art. 18 */}
                <li>Right to restriction of processing in certain circumstances</li>
                {/* Right to withdraw consent -- KVKK Art. 7, GDPR Art. 7(3) */}
                <li>Right to withdraw consent at any time (where processing is based on consent)</li>
              </ul>
            </div>
          </section>

          {/* ============================================================
              CONTACT SECTION
              Provides contact information for privacy-related inquiries.
              Separated from the main content by a thin gold border.
              Required by both KVKK Article 10 and GDPR Article 13.
              ============================================================ */}
          <section className={styles.contactSection}>
            <h2 className={styles.sectionTitle}>{t('contact')}</h2>
            <p className={styles.contactText}>
              {/* Contact instructions for data protection inquiries */}
              For any questions or requests regarding your personal data and privacy,
              please contact us at ozgul.oriva@gmail.com. We will respond to your
              request within 30 days as required by applicable data protection law.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
