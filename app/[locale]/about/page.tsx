/**
 * app/[locale]/about/page.tsx -- About page for Ozgul's Realty
 *
 * This SERVER component displays the real estate agent's profile, including
 * their portrait photo, professional title, multilingual biography, and a
 * contact form for direct inquiries.
 *
 * Page structure (2 sections):
 *   1. Agent Hero -- 2-column layout with portrait photo (left) and
 *      biographical information (right): name, subtitle, professional title,
 *      and multilingual bio text.
 *
 *   2. Contact Section -- Centered ContactForm for visitor inquiries,
 *      with an id="contact" anchor for same-page smooth scrolling.
 *
 * Removed (previously section 2):
 *   - Stats Section (years of experience + active listings + client rating)
 *     was removed per design direction. The columns still exist in the DB
 *     for backwards compatibility but are no longer surfaced on this page.
 *
 * Data fetching:
 *   - Agent profile: prisma.agent.findFirst() (single-agent architecture)
 *
 * Multilingual bio fallback logic:
 *   locale === 'tr' && agent.bioTr ? agent.bioTr :
 *   locale === 'ru' && agent.bioRu ? agent.bioRu :
 *   locale === 'ar' && agent.bioAr ? agent.bioAr :
 *   agent.bio (English fallback)
 *
 * Layout components (Navbar, SmoothScroll, CookieBanner) are rendered here
 * because they are NOT in the locale layout (admin pages need to omit them).
 *
 * Styling: All styles via CSS Modules (about.module.css). Zero inline styles.
 */

import { getTranslations, getLocale } from 'next-intl/server'
import prisma from '@/app/lib/prisma'
import CloudinaryImage from '@/app/components/CloudinaryImage'

/* -- Layout components -- */
import Navbar from '@/app/components/Navbar'
import SmoothScroll from '@/app/components/SmoothScroll'
import CookieBanner from '@/app/components/CookieBanner'

/* -- Animation wrappers -- */
import AnimatedSection from '@/app/components/AnimatedSection'
import FadeIn from '@/app/components/FadeIn'

/* -- Content components -- */
import ContactForm from '@/app/components/ContactForm'

/* -- CSS Module -- */
import styles from './about.module.css'

/**
 * Generate metadata for the About page.
 * Sets the page title for SEO and the browser tab using the
 * translated 'about.title' string from messages/*.json.
 */
export async function generateMetadata() {
  const t = await getTranslations('about')
  return {
    title: t('title'),
  }
}

/**
 * AboutPage -- agent profile and contact page server component
 *
 * Fetches the agent's profile data, resolves the multilingual biography,
 * and renders the hero section and contact form.
 *
 * @returns The fully rendered about page JSX
 */
export default async function AboutPage() {
  /* ------------------------------------------------------------------ */
  /*  Data fetching                                                      */
  /* ------------------------------------------------------------------ */

  /** Resolve the current locale for multilingual bio fallback */
  const locale = await getLocale()

  /** Load translation functions for used namespaces */
  const tAbout = await getTranslations('about')
  const tContact = await getTranslations('contact')

  /**
   * Fetch the single agent profile from the database.
   * Single-agent architecture: findFirst() always returns the one agent record.
   */
  const agent = await prisma.agent.findFirst()

  /* ------------------------------------------------------------------ */
  /*  Multilingual bio resolution                                        */
  /* ------------------------------------------------------------------ */

  /**
   * getAgentBio -- selects the agent's biography in the current locale.
   * Follows the standard multilingual fallback pattern:
   *   1. If the locale has a dedicated translation AND it exists, use it.
   *   2. Otherwise, fall back to the English bio (always present).
   *
   * @returns The biography string in the best available language.
   */
  const getAgentBio = (): string => {
    if (!agent) return ''
    /* Turkish locale -- prefer Turkish bio if available */
    if (locale === 'tr' && agent.bioTr) return agent.bioTr
    /* Russian locale -- prefer Russian bio if available */
    if (locale === 'ru' && agent.bioRu) return agent.bioRu
    /* Arabic locale -- prefer Arabic bio if available */
    if (locale === 'ar' && agent.bioAr) return agent.bioAr
    /* Default fallback -- English bio (always populated) */
    return agent.bio
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <>
      {/* Global layout components */}
      <Navbar />
      <SmoothScroll />
      <CookieBanner />

      <main className={styles.page}>
        {/* ============================================================
            SECTION 1: AGENT HERO
            Two-column layout with portrait photo and biographical info.
            Only rendered if agent data exists in the database.
            ============================================================ */}
        {agent && (
          <section className={styles.heroSection}>
            <div className={styles.heroGrid}>
              {/* --------------------------------------------------------
                  LEFT COLUMN: Agent portrait photo
                  Uses CloudinaryImage in fill mode within an aspect-ratio wrapper.
                  -------------------------------------------------------- */}
              <FadeIn direction="left">
                <div className={styles.imageWrapper}>
                  <CloudinaryImage
                    src={agent.imageId}
                    alt={agent.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.agentImage}
                  />
                </div>
              </FadeIn>

              {/* --------------------------------------------------------
                  RIGHT COLUMN: Agent biographical information
                  Includes page title, subtitle, professional title, and bio.
                  -------------------------------------------------------- */}
              <FadeIn direction="right" delay={0.15}>
                <div className={styles.bioContent}>
                  {/* Page heading -- "About Ozgul Peksen" (translated) */}
                  <h1 className={styles.pageTitle}>
                    {tAbout('title')}
                  </h1>

                  {/* Page subtitle -- translated description */}
                  <p className={styles.pageSubtitle}>
                    {tAbout('subtitle')}
                  </p>

                  {/* Multilingual biography with English fallback */}
                  <p className={styles.agentBio}>
                    {getAgentBio()}
                  </p>
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* ============================================================
            SECTION 2: CONTACT
            Centered contact form for direct agent inquiries.
            ID="contact" enables smooth scrolling from navigation links.
            ============================================================ */}
        <AnimatedSection>
          <section id="contact" className={styles.contactSection}>
            <div className={styles.contactWrapper}>
              {/* Contact section heading */}
              <h2 className={styles.contactTitle}>
                {tContact('title')}
              </h2>

              {/* Contact section description */}
              <p className={styles.contactSubtitle}>
                {tContact('subtitle')}
              </p>

              {/* ContactForm component -- handles form state and submission */}
              <ContactForm />
            </div>
          </section>
        </AnimatedSection>
      </main>
    </>
  )
}
