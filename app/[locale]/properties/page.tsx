/**
 * app/[locale]/properties/page.tsx -- Property listing page for Ozgul's Realty
 *
 * This SERVER component displays a filterable grid of all property listings.
 * It reads filter criteria from URL searchParams and builds a dynamic Prisma
 * query to fetch matching properties from the database.
 *
 * Features:
 *   - Dynamic filtering via URL searchParams (type, location, minPrice,
 *     maxPrice, bedrooms, search)
 *   - PropertiesFilter component in a Suspense boundary for streaming
 *   - Responsive property card grid (3 columns desktop, 2 tablet, 1 mobile)
 *   - "No results" empty state with a reset link
 *   - All text is translated via next-intl
 *
 * Supported searchParams:
 *   - type      : 'sale' | 'rent' -- maps to forSale boolean in the DB
 *   - location  : string          -- case-insensitive substring match
 *   - minPrice  : number          -- minimum price (inclusive)
 *   - maxPrice  : number          -- maximum price (inclusive)
 *   - bedrooms  : number          -- minimum bedroom count (inclusive)
 *   - search    : string          -- keyword search across title and description
 *
 * Data flow:
 *   1. Read searchParams from the page props
 *   2. Build a Prisma `where` clause from the non-empty params
 *   3. Fetch matching properties
 *   4. Render the filter bar + results grid (or empty state)
 *
 * Layout components (Navbar, SmoothScroll, CookieBanner) are rendered here
 * because they are NOT in the locale layout (admin pages need to omit them).
 *
 * Styling: All styles via CSS Modules (properties.module.css). Zero inline styles.
 */

import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
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
import PropertiesFilter from '@/app/components/PropertiesFilter'
import PropertyImage from '@/app/components/PropertyImage'

/* -- CSS Module -- */
import styles from './properties.module.css'

/**
 * Type definition for the searchParams object passed by Next.js
 * All values are optional strings (or string arrays) from the URL query string.
 */
interface SearchParams {
  type?: string
  location?: string
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  search?: string
}

/**
 * generateMetadata -- SEO title + description for the properties listing page.
 *
 * Mirrors the pattern established by app/[locale]/about/page.tsx so every
 * public page has a localized browser-tab title and Open Graph description.
 *
 * The title ("Properties") is composed with the locale layout's
 * "%s — Özgül's Realty" template, producing e.g. "Properties — Özgül's Realty".
 * The description is pulled from the same "properties.subtitle" string that
 * already appears on the page body, keeping SEO copy in sync with the UI.
 */
export async function generateMetadata() {
  const t = await getTranslations('properties')
  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

/**
 * PropertiesPage -- main property listing server component
 *
 * Reads URL searchParams, queries the database with dynamic filters,
 * and renders the filter bar + property grid.
 *
 * @param props.searchParams -- URL query parameters for filtering
 * @returns The fully rendered properties listing page
 */
export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  /* ------------------------------------------------------------------ */
  /*  Translations                                                       */
  /* ------------------------------------------------------------------ */

  /** Load translation function for the 'properties' namespace */
  const t = await getTranslations('properties')

  /* ------------------------------------------------------------------ */
  /*  Parse search parameters                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Await the searchParams promise (Next.js 15+ passes it as a Promise).
   * Destructure all supported filter parameters.
   */
  const { type, location, minPrice, maxPrice, bedrooms, search } =
    await searchParams

  /* ------------------------------------------------------------------ */
  /*  Build dynamic Prisma where clause                                  */
  /* ------------------------------------------------------------------ */

  /**
   * whereClause -- dynamically constructed Prisma filter object.
   * Only non-empty searchParams are added to the clause, so if no
   * filters are active, all properties are returned.
   *
   * Uses `Record<string, unknown>` as the base type because the
   * shape depends on which filters are active.
   */
  const whereClause: Record<string, unknown> = {}

  /**
   * Type filter -- maps URL 'sale'/'rent' strings to the forSale boolean.
   * 'sale' -> forSale: true (property is for sale)
   * 'rent' -> forSale: false (property is for rent)
   * Empty/absent -> no filter (show all types)
   */
  if (type === 'sale') {
    whereClause.forSale = true
  } else if (type === 'rent') {
    whereClause.forSale = false
  }

  /**
   * Location filter -- case-insensitive substring match.
   * Prisma's `contains` with `mode: 'insensitive'` performs a
   * case-insensitive LIKE query on the location field.
   */
  if (location) {
    whereClause.location = {
      contains: location,
      mode: 'insensitive',
    }
  }

  /**
   * Price range filter -- uses Prisma's `gte` and `lte` operators.
   * Only applied when the corresponding param is a valid number.
   */
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {}
    /* Minimum price (inclusive) */
    if (minPrice && !isNaN(Number(minPrice))) {
      priceFilter.gte = Number(minPrice)
    }
    /* Maximum price (inclusive) */
    if (maxPrice && !isNaN(Number(maxPrice))) {
      priceFilter.lte = Number(maxPrice)
    }
    whereClause.price = priceFilter
  }

  /**
   * Bedrooms filter -- minimum bedroom count (inclusive).
   * Only applied when the param is a valid number.
   */
  if (bedrooms && !isNaN(Number(bedrooms))) {
    whereClause.bedrooms = {
      gte: Number(bedrooms),
    }
  }

  /**
   * Search filter -- keyword search across title AND description fields.
   * Uses Prisma's `OR` operator to match the search term in either field.
   * Both use case-insensitive contains for broad matching.
   */
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  /* ------------------------------------------------------------------ */
  /*  Fetch properties from database                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Query the database with the constructed where clause.
   * Orders results by creation date (newest first) for relevance.
   */
  const properties = await prisma.property.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  })

  /**
   * hasFilters -- boolean indicating whether any filters are active.
   * Used to conditionally show the "reset filters" link in the empty state.
   */
  const hasFilters = !!(type || location || minPrice || maxPrice || bedrooms || search)

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
            PAGE HEADER
            Title and subtitle for the properties listing page
            ============================================================ */}
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        {/* ============================================================
            CONTENT AREA
            Contains the filter bar and the property grid / empty state
            ============================================================ */}
        <div className={styles.content}>
          {/* --------------------------------------------------------
              FILTER BAR
              Wrapped in Suspense because PropertiesFilter is a client
              component that reads useSearchParams (requires Suspense
              boundary in Next.js 14+).
              -------------------------------------------------------- */}
          <Suspense fallback={null}>
            <PropertiesFilter />
          </Suspense>

          {/* --------------------------------------------------------
              PROPERTY GRID or EMPTY STATE
              Conditionally render based on whether properties were found
              -------------------------------------------------------- */}
          {properties.length > 0 ? (
            /* Property cards grid */
            <div className={styles.grid}>
              {properties.map((property: Property, index: number) => (
                /**
                 * FadeIn wraps each card for staggered entrance animation.
                 * Delay is capped at 0.5s to avoid long waits for large lists.
                 */
                <FadeIn
                  key={property.id}
                  delay={Math.min(index * 0.1, 0.5)}
                >
                  {/* Card links to the property detail page */}
                  <Link
                    href={`/properties/${property.id}`}
                    className={styles.card}
                  >
                    {/* Property cover image */}
                    <div className={styles.cardImageWrapper}>
                      <PropertyImage
                        publicId={
                          property.imageIds.length > 0
                            ? property.imageIds[0]
                            : undefined
                        }
                        alt={property.title}
                        className={styles.cardImage}
                      />
                    </div>

                    {/* Property text details */}
                    <div className={styles.cardInfo}>
                      {/* Property name */}
                      <h2 className={styles.cardTitle}>
                        {property.title}
                      </h2>

                      {/* Location */}
                      <p className={styles.cardLocation}>
                        {property.location}
                      </p>

                      {/* Price in Euros */}
                      <p className={styles.cardPrice}>
                        &euro;{property.price.toLocaleString()}
                      </p>

                      {/* Property meta: bedrooms, bathrooms, area */}
                      <div className={styles.cardMeta}>
                        <span>{property.bedrooms} {t('bedrooms')}</span>
                        <span>{property.bathrooms} {t('bathrooms')}</span>
                        <span>{property.area} {t('sqm')}</span>
                      </div>

                      {/* View Details link */}
                      <span className={styles.cardLink}>
                        {t('viewDetails')} &rarr;
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          ) : (
            /* --------------------------------------------------------
                NO RESULTS EMPTY STATE
                Shown when no properties match the active filters.
                Includes explanatory text and a reset link.
                -------------------------------------------------------- */
            <div className={styles.noResults}>
              <h2 className={styles.noResultsTitle}>
                {t('noResults')}
              </h2>
              <p className={styles.noResultsText}>
                {t('noResultsText')}
              </p>

              {/* Show reset link only if filters are active */}
              {hasFilters && (
                <Link href="/properties" className={styles.resetLink}>
                  {t('resetFilters')}
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
