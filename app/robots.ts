/**
 * app/robots.ts — Robots.txt configuration for Özgül's Realty
 *
 * Generates the robots.txt file that tells search engine crawlers
 * which pages to index and which to avoid.
 *
 * Key rules:
 * - Allow all public pages (homepage, properties, about, legal)
 * - DISALLOW all admin panel URLs (contains /nmo-bbo-141522)
 *   to prevent admin pages from appearing in search results
 * - Include sitemap URL for search engine discovery
 */

import { MetadataRoute } from 'next'

/**
 * Generate robots.txt configuration
 * Returns rules for search engine crawlers
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      /* Allow all crawlers to access public pages */
      userAgent: '*',
      allow: '/',
      /* Block admin panel from search engines — secret URL protection */
      disallow: [
        '/*/nmo-bbo-141522',
        '/*/nmo-bbo-141522/*',
      ],
    },
    /* Sitemap URL for search engine discovery */
    sitemap: 'https://ozguls-realty.vercel.app/sitemap.xml',
  }
}
