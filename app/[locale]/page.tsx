/**
 * app/[locale]/page.tsx -- Homepage for Ozgul's Realty
 *
 * This is the main landing page and the first thing visitors see. It is a
 * SERVER component that fetches data at request time from the database and
 * renders four visually distinct sections:
 *
 *   1. Hero Section      -- Full-viewport background image with overlay text,
 *                           title, subtitle, and two call-to-action buttons
 *                           (Explore Properties + Get In Touch).
 *
 *   2. Featured Properties -- A 3-column grid of the most prominent listings,
 *                             each shown as a card with image, title, location,
 *                             price, and a "View Details" link.
 *
 *   3. Agent Section      -- Introduction to the real estate agent with a
 *                            portrait photo, name, professional title,
 *                            multilingual biography, and a link to the About page.
 *
 *   4. Contact Section    -- A centered contact form allowing visitors to
 *                            send inquiries directly from the homepage.
 *
 * Data fetching:
 *   - Featured properties: prisma.property.findMany({ where: { featured: true }, take: 3 })
 *   - Agent profile: prisma.agent.findFirst() (single-agent architecture)
 *
 * Multilingual support:
 *   - Static UI text via next-intl getTranslations (server-side)
 *   - Dynamic content (agent bio) uses locale-aware fallback logic:
 *     If the current locale's translation exists, use it; otherwise fall back to English.
 *
 * Imports:
 *   - Navbar, SmoothScroll, CookieBanner are rendered on this page
 *     (not in the layout, to allow admin pages to omit them)
 *   - AnimatedSection and FadeIn provide scroll-triggered entrance animations
 *   - HeroImage renders the full-bleed Cloudinary hero photograph
 *   - PropertyImage renders optimised Cloudinary property thumbnails
 *   - ContactForm handles the inquiry submission form
 *   - CloudinaryImage (from next-cloudinary) renders the agent portrait
 *   - Link from i18n/navigation provides locale-aware routing
 *
 * Styling: All styles via CSS Modules (home.module.css). Zero inline styles.
 */

import { getTranslations, getLocale } from 'next-intl/server'
import prisma from '@/app/lib/prisma'
import type { Property } from '@prisma/client'
import { Link } from '@/i18n/navigation'
import CloudinaryImage from '@/app/components/CloudinaryImage'

/* -- Layout components (rendered on public pages, not admin) -- */
import Navbar from '@/app/components/Navbar'
import SmoothScroll from '@/app/components/SmoothScroll'
import CookieBanner from '@/app/components/CookieBanner'

/* -- Animation wrappers -- */
import AnimatedSection from '@/app/components/AnimatedSection'
import FadeIn from '@/app/components/FadeIn'

/* -- Content components -- */
import HeroImage from '@/app/components/HeroImage'
import PropertyImage from '@/app/components/PropertyImage'
import ContactForm from '@/app/components/ContactForm'

/* -- CSS Module -- */
import styles from './home.module.css'

/**
 * HomePage -- the main landing page server component
 *
 * Fetches featured properties and agent data from the database,
 * resolves translations for the current locale, and renders all
 * four homepage sections with scroll-triggered animations.
 *
 * @returns The fully rendered homepage JSX
 */
export default async function HomePage() {
  /* ------------------------------------------------------------------ */
  /*  Data fetching (runs on the server at request time)                 */
  /* ------------------------------------------------------------------ */

  /**
   * Resolve the current locale from the URL segment (e.g., 'en', 'tr', 'ru', 'ar').
   * Used for multilingual fallback logic on dynamic content.
   */
  const locale = await getLocale()

  /**
   * Load translation functions for each namespace used on this page.
   * These are server-side -- no client bundle cost.
   */
  const tHero = await getTranslations('hero')
  const tProperties = await getTranslations('properties')
  const tAbout = await getTranslations('about')
  const tContact = await getTranslations('contact')

  /**
   * Fetch the 3 most recent featured properties from the database.
   * The `featured` flag is toggled in the admin panel.
   * `take: 3` limits results to exactly 3 cards for the homepage grid.
   */
  const featuredProperties = await prisma.property.findMany({
    where: { featured: true },
    take: 3,
  })

  /**
   * Fetch the single agent profile.
   * Single-agent architecture: findFirst() always returns the one agent record.
   * Used to display name, title, bio, and photo in the Agent section.
   */
  const agent = await prisma.agent.findFirst()

  /**
   * getAgentBio -- resolves the agent's biography based on the current locale.
   * Implements the multilingual fallback pattern:
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
      {/* ============================================================
          Global layout components
          Navbar: fixed top navigation with scroll-based transparency
          SmoothScroll: Lenis smooth scrolling (renders no visible UI)
          CookieBanner: GDPR/KVKK consent banner (shows once per visitor)
          ============================================================ */}
      <Navbar />
      <SmoothScroll />
      <CookieBanner />

      <main>
        {/* ============================================================
            SECTION 1: HERO
            Full-viewport background image with overlay content.
            HeroImage handles the Cloudinary image + dark gradient overlay.
            heroContent sits on top with title, subtitle, and 2 CTA buttons.
            ============================================================ */}
        <section className={styles.heroSection}>
          {/* Background image -- uses first featured property's image or fallback */}
          <HeroImage
            publicId={
              featuredProperties.length > 0 && featuredProperties[0].imageIds.length > 0
                ? featuredProperties[0].imageIds[0]
                : undefined
            }
          />

          {/* Overlay content -- positioned absolute over the hero image */}
          <div className={styles.heroContent}>
            {/* Main headline -- translated per locale */}
            <h1 className={styles.heroTitle}>
              {tHero('title')}
            </h1>

            {/* Subtitle -- translated per locale */}
            <p className={styles.heroSubtitle}>
              {tHero('subtitle')}
            </p>

            {/* CTA buttons row */}
            <div className={styles.heroButtons}>
              {/* Primary CTA -- scrolls to the featured properties section */}
              <a
                href="#properties"
                className={`${styles.heroCta} ${styles.heroCtaPrimary}`}
              >
                {tHero('ctaProperties')}
              </a>

              {/* Secondary CTA -- scrolls to the contact form section */}
              <a
                href="#contact"
                className={`${styles.heroCta} ${styles.heroCtaSecondary}`}
              >
                {tHero('ctaContact')}
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: FEATURED PROPERTIES
            3-column grid of property cards with scroll-triggered animation.
            Each card links to the property detail page.
            ID="properties" enables smooth scroll from the hero CTA.
            ============================================================ */}
        <AnimatedSection>
          <section id="properties" className={styles.section}>
            {/* Section heading */}
            <h2 className={styles.sectionTitle}>
              {tProperties('featured')}
            </h2>

            {/* Section description */}
            <p className={styles.sectionSubtitle}>
              {tProperties('subtitle')}
            </p>

            {/* Property cards grid -- 3 columns desktop, 2 tablet, 1 mobile */}
            <div className={styles.propertiesGrid}>
              {featuredProperties.map((property: Property, index: number) => (
                /**
                 * FadeIn wraps each card with a staggered entrance animation.
                 * delay is calculated as index * 0.15s so cards appear sequentially
                 * from left to right as the user scrolls them into view.
                 */
                <FadeIn key={property.id} delay={index * 0.15}>
                  {/* Card links to the property detail page */}
                  <Link
                    href={`/properties/${property.id}`}
                    className={styles.propertyCard}
                  >
                    {/* Property cover image -- uses first imageId from the array */}
                    <div className={styles.propertyImageWrapper}>
                      <PropertyImage
                        publicId={
                          property.imageIds.length > 0
                            ? property.imageIds[0]
                            : undefined
                        }
                        alt={property.title}
                        className={styles.propertyCardImage}
                      />
                    </div>

                    {/* Property text details */}
                    <div className={styles.propertyInfo}>
                      {/* Property title / name */}
                      <h3 className={styles.propertyTitle}>
                        {property.title}
                      </h3>

                      {/* Location (e.g., "Antalya, Konyaalti") */}
                      <p className={styles.propertyLocation}>
                        {property.location}
                      </p>

                      {/* Price -- always displayed in Euros with locale formatting */}
                      <p className={styles.propertyPrice}>
                        &euro;{property.price.toLocaleString()}
                      </p>

                      {/* View Details link text */}
                      <span className={styles.viewDetails}>
                        {tProperties('viewDetails')} &rarr;
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>

            {/* Link to view the full property listing page */}
            <div className={styles.viewAllWrapper}>
              <Link href="/properties" className={styles.viewAllLink}>
                {tProperties('viewAll')} &rarr;
              </Link>
            </div>
          </section>
        </AnimatedSection>

        {/* ============================================================
            SECTION 3: AGENT
            Two-column layout introducing the real estate agent.
            Left: portrait photo via CloudinaryImage (Cloudinary).
            Right: name, title, multilingual bio, and link to About page.
            Uses ivory background for visual separation.
            Only rendered if agent data exists in the database.
            ============================================================ */}
        {agent && (
          <AnimatedSection>
            <section className={styles.agentSection}>
              <div className={styles.agentGrid}>
                {/* Agent portrait photo */}
                <div className={styles.agentImageWrapper}>
                  <CloudinaryImage
                    src={agent.imageId}
                    alt={agent.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.agentImage}
                  />
                </div>

                {/* Agent bio content */}
                <div>
                  {/* Agent's full name */}
                  <h2 className={styles.agentName}>
                    {agent.name}
                  </h2>

                  {/* Professional title */}
                  <p className={styles.agentTitle}>
                    {agent.title}
                  </p>

                  {/* Biography text -- uses locale-aware fallback */}
                  <p className={styles.agentBio}>
                    {getAgentBio()}
                  </p>

                  {/* Link to the full About page */}
                  <Link href="/about" className={styles.agentLink}>
                    {tAbout('title')} &rarr;
                  </Link>
                </div>
              </div>
            </section>
          </AnimatedSection>
        )}

        {/* ============================================================
            SECTION 4: CONTACT
            Centered contact form for visitor inquiries.
            ID="contact" enables smooth scroll from navbar and hero CTAs.
            Uses cream background for warmth and visual separation.
            ============================================================ */}
        <AnimatedSection>
          <section id="contact" className={styles.contactSection}>
            <div className={styles.contactWrapper}>
              {/* Section heading */}
              <h2 className={styles.sectionTitle}>
                {tContact('title')}
              </h2>

              {/* Section description */}
              <p className={styles.sectionSubtitle}>
                {tContact('subtitle')}
              </p>

              {/* ContactForm component -- handles form state, validation, and submission */}
              <ContactForm />
            </div>
          </section>
        </AnimatedSection>
      </main>
    </>
  )
}
