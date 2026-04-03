/**
 * i18n/routing.ts — Internationalization routing configuration
 *
 * Defines the supported locales and default locale for the application.
 * Used by next-intl middleware (proxy.ts) and throughout the app
 * to determine available languages and URL structure.
 *
 * Supported locales:
 * - en: English (default — fallback for all content)
 * - tr: Turkish (admin panel UI language)
 * - ru: Russian (target audience)
 * - ar: Arabic (target audience — requires RTL support)
 */

import { defineRouting } from 'next-intl/routing'

/* Define the routing configuration for next-intl */
export const routing = defineRouting({
  /* All supported locales — order matters for URL generation */
  locales: ['en', 'tr', 'ru', 'ar'],

  /* Default locale — used when no locale prefix is in the URL */
  defaultLocale: 'en',
})
