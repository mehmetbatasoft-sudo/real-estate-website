/**
 * app/[locale]/properties/[id]/page.tsx -- Property detail page for Ozgul's Realty
 *
 * This SERVER component displays the full details of a single property listing.
 * It is accessed via the dynamic route /properties/[id] where [id] is the
 * property's database integer ID.
 *
 * Features:
 *   - Full image gallery (ImageGallery component with Embla carousel)
 *   - Property title, price, location, and key stats (bedrooms, bathrooms, area)
 *   - Multilingual description with English fallback
 *   - 2/3 + 1/3 layout: details on the left, sticky ContactForm on the right
 *   - "Similar Properties" section at the bottom (3 cards)
 *   - 404 handling when property ID is not found
 *
 * Data fetching:
 *   - Primary property: prisma.property.findUnique({ where: { id } })
 *   - Similar properties: prisma.property.findMany() filtered by same location,
 *     excluding the current property, limited to 3 results.
 *     Falls back to the 3 most recent properties if no location matches.
 *
 * Multilingual description fallback logic:
 *   locale === 'tr' && descriptionTr ? descriptionTr :
 *   locale === 'ru' && descriptionRu ? descriptionRu :
 *   locale === 'ar' && descriptionAr ? descriptionAr :
 *   description (English fallback)
 *
 * Note on inline style:
 *   The main wrapper uses `style={{ paddingTop: '80px' }}` as the ONE allowed
 *   inline style per project documentation, to compensate for the fixed navbar
 *   overlapping the page content. All other styling uses CSS Modules.
 *
 * Styling: All styles via CSS Modules (detail.module.css) except the one
 *          paddingTop inline style noted above.
 */

import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import prisma from '@/app/lib/prisma'
import type { Property } from '@prisma/client'
import { Link } from '@/i18n/navigation'

/* -- Layout components -- */
import Navbar from '@/app/components/Navbar'
import SmoothScroll from '@/app/components/SmoothScroll'
import CookieBanner from '@/app/components/CookieBanner'

/* -- Animation wrappers -- */
import FadeIn from '@/app/components/FadeIn'

/* -- Content components -- */
import ImageGallery from '@/app/components/ImageGallery'
import ContactForm from '@/app/components/ContactForm'
import PropertyImage from '@/app/components/PropertyImage'

/* -- CSS Module -- */
import styles from './detail.module.css'

/**
 * Generate metadata for the property detail page.
 * Sets the page title dynamically to the property's title for SEO
 * and the browser tab. Falls back to the generic 'View Details'
 * translation if the property is not found.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const propertyId = parseInt(id, 10)

  /* Attempt to fetch the property title for the page metadata */
  if (!isNaN(propertyId)) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true },
    })
    if (property) {
      return { title: property.title }
    }
  }

  /* Fallback: use a generic translated title */
  const t = await getTranslations('properties')
  return { title: t('viewDetails') }
}

/**
 * PropertyDetailPage -- full property listing detail view
 *
 * Fetches the property by ID from the URL params, renders the image gallery,
 * property information, contact form, and similar property suggestions.
 *
 * @param props.params -- dynamic route params containing the property ID
 * @returns The fully rendered property detail page, or 404 if not found
 */
export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  /* ------------------------------------------------------------------ */
  /*  Resolve params and locale                                          */
  /* ------------------------------------------------------------------ */

  /** Await the dynamic route params (Next.js 15+ passes params as a Promise) */
  const { id } = await params

  /** Resolve the current locale for multilingual description fallback */
  const locale = await getLocale()

  /** Load translation functions for the property and contact namespaces */
  const t = await getTranslations('properties')
  const tContact = await getTranslations('contact')

  /* ------------------------------------------------------------------ */
  /*  Parse the property ID                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Parse the ID from the URL string to an integer.
   * If the ID is not a valid number, show the 404 page.
   */
  const propertyId = parseInt(id, 10)

  /* Guard: invalid ID format */
  if (isNaN(propertyId)) {
    notFound()
  }

  /* ------------------------------------------------------------------ */
  /*  Fetch the property from the database                               */
  /* ------------------------------------------------------------------ */

  /**
   * Fetch the property by its unique integer ID.
   * Returns null if no property exists with this ID.
   */
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  /* Guard: property not found in database */
  if (!property) {
    notFound()
  }

  /* ------------------------------------------------------------------ */
  /*  Fetch similar properties                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Attempt to find similar properties from the same location.
   * Excludes the current property by its ID.
   * Limited to 3 results for the "Similar Properties" grid.
   */
  let similarProperties = await prisma.property.findMany({
    where: {
      /* Same location as the current property */
      location: property.location,
      /* Exclude the current property */
      id: { not: property.id },
    },
    take: 3,
  })

  /**
   * Fallback: if no location-matched properties were found,
   * fetch the 3 most recent properties (excluding current).
   * This ensures the "Similar Properties" section is never empty
   * unless the database has only one property.
   */
  if (similarProperties.length === 0) {
    similarProperties = await prisma.property.findMany({
      where: {
        id: { not: property.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  }

  /* ------------------------------------------------------------------ */
  /*  Resolve multilingual description                                   */
  /* ------------------------------------------------------------------ */

  /**
   * getDescription -- selects the property description in the current locale.
   * Uses the standard multilingual fallback pattern:
   *   1. If current locale's translation exists, use it.
   *   2. Otherwise, fall back to the English description (always present).
   *
   * @returns The description string in the best available language.
   */
  const getDescription = (): string => {
    /* Turkish locale -- prefer Turkish description */
    if (locale === 'tr' && property.descriptionTr) return property.descriptionTr
    /* Russian locale -- prefer Russian description */
    if (locale === 'ru' && property.descriptionRu) return property.descriptionRu
    /* Arabic locale -- prefer Arabic description */
    if (locale === 'ar' && property.descriptionAr) return property.descriptionAr
    /* Default fallback -- English description */
    return property.description
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

      {/* ============================================================
          MAIN WRAPPER
          paddingTop: '80px' is the ONE allowed inline style per docs.
          It prevents the fixed navbar from overlapping the gallery.
          ============================================================ */}
      <main className={styles.page} style={{ paddingTop: '80px' }}>
        {/* ============================================================
            IMAGE GALLERY
            Full-width carousel with thumbnails and navigation arrows.
            Receives the property's Cloudinary image IDs.
            ============================================================ */}
        <div className={styles.galleryArea}>
          <ImageGallery imageIds={property.imageIds} />
        </div>

        {/* ============================================================
            CONTENT: 2/3 DETAILS + 1/3 STICKY CONTACT FORM
            Two-column grid layout that collapses to single column
            on mobile devices.
            ============================================================ */}
        <div className={styles.contentWrapper}>
          {/* --------------------------------------------------------
              LEFT COLUMN: PROPERTY DETAILS
              Title, location, price, stats, and description
              -------------------------------------------------------- */}
          <div className={styles.details}>
            <FadeIn>
              {/* Property title */}
              <h1 className={styles.propertyTitle}>
                {property.title}
              </h1>

              {/* Property location */}
              <p className={styles.propertyLocation}>
                {property.location}
              </p>

              {/* Property price -- always in Euros with locale formatting */}
              <p className={styles.propertyPrice}>
                &euro;{property.price.toLocaleString()}
              </p>
            </FadeIn>

            {/* --------------------------------------------------------
                PROPERTY STATS GRID
                Key metrics: bedrooms, bathrooms, area in sqm
                -------------------------------------------------------- */}
            <FadeIn delay={0.1}>
              <div className={styles.infoGrid}>
                {/* Bedrooms stat */}
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>{t('bedrooms')}</div>
                  <div className={styles.infoValue}>{property.bedrooms}</div>
                </div>

                {/* Bathrooms stat */}
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>{t('bathrooms')}</div>
                  <div className={styles.infoValue}>{property.bathrooms}</div>
                </div>

                {/* Area stat in square meters */}
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>{t('area')}</div>
                  <div className={styles.infoValue}>
                    {property.area} {t('sqm')}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* --------------------------------------------------------
                PROPERTY DESCRIPTION
                Multilingual with English fallback
                -------------------------------------------------------- */}
            <FadeIn delay={0.2}>
              <h2 className={styles.descriptionTitle}>
                {t('viewDetails')}
              </h2>
              <p className={styles.description}>
                {getDescription()}
              </p>
            </FadeIn>
          </div>

          {/* --------------------------------------------------------
              RIGHT COLUMN: STICKY CONTACT FORM
              Sticks to the viewport while scrolling through long
              property descriptions. Passes the property title to
              pre-fill the inquiry's property reference.
              -------------------------------------------------------- */}
          <aside className={styles.sidebar}>
            <FadeIn direction="right" delay={0.2}>
              <h3 className={styles.sidebarTitle}>
                {tContact('propertyInquiry')}
              </h3>
              {/* ContactForm with propertyTitle prop for inquiry reference */}
              <ContactForm propertyTitle={property.title} />
            </FadeIn>
          </aside>
        </div>

        {/* ============================================================
            SIMILAR PROPERTIES SECTION
            3-column grid of related listings at the bottom.
            Only rendered if there are similar properties to show.
            ============================================================ */}
        {similarProperties.length > 0 && (
          <section className={styles.similarSection}>
            <div className={styles.similarWrapper}>
              {/* Section heading */}
              <h2 className={styles.similarTitle}>
                {t('similarProperties')}
              </h2>

              {/* Similar properties grid */}
              <div className={styles.similarGrid}>
                {similarProperties.map((similar: Property, index: number) => (
                  /**
                   * FadeIn with staggered delay for sequential entrance.
                   * Links to the similar property's detail page.
                   */
                  <FadeIn key={similar.id} delay={index * 0.15}>
                    <Link
                      href={`/properties/${similar.id}`}
                      className={styles.similarCard}
                    >
                      {/* Cover image */}
                      <div className={styles.similarCardImageWrapper}>
                        <PropertyImage
                          publicId={
                            similar.imageIds.length > 0
                              ? similar.imageIds[0]
                              : undefined
                          }
                          alt={similar.title}
                          className={styles.similarCardImage}
                        />
                      </div>

                      {/* Card details */}
                      <div className={styles.similarCardInfo}>
                        <h3 className={styles.similarCardTitle}>
                          {similar.title}
                        </h3>
                        <p className={styles.similarCardPrice}>
                          &euro;{similar.price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
