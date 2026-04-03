/**
 * app/sitemap.ts — Dynamic sitemap generation for Özgül's Realty
 *
 * Generates a sitemap.xml that includes:
 * - All locale variants of static pages (homepage, properties, about, privacy, cookies)
 * - All locale variants of each individual property page
 * - Proper lastModified dates for property pages
 *
 * This helps search engines discover and index all pages efficiently,
 * especially the multilingual variants.
 *
 * Generated at build time and revalidated on each request.
 */

import { MetadataRoute } from 'next'
import prisma from '@/app/lib/prisma'

/* Force dynamic rendering — sitemap queries the database at runtime, not build time */
export const dynamic = 'force-dynamic'

/* Base URL for the production site */
const BASE_URL = 'https://ozguls-realty.vercel.app'

/* All supported locales */
const LOCALES = ['en', 'tr', 'ru', 'ar']

/**
 * Generate the sitemap with all locale × page combinations
 * Includes both static pages and dynamic property pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Fetch all properties for dynamic property pages */
  const properties = await prisma.property.findMany({
    select: { id: true, updatedAt: true },
  })

  /* Static pages that exist in all locales */
  const staticPages = ['', '/properties', '/about', '/privacy', '/cookies']

  /* Generate sitemap entries for static pages × locales */
  const staticEntries = LOCALES.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  )

  /* Generate sitemap entries for property detail pages × locales */
  const propertyEntries = LOCALES.flatMap((locale) =>
    properties.map((property) => ({
      url: `${BASE_URL}/${locale}/properties/${property.id}`,
      lastModified: property.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))
  )

  /* Combine all entries */
  return [...staticEntries, ...propertyEntries]
}
