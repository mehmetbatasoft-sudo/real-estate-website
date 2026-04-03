/**
 * next.config.ts — Next.js configuration for Özgül's Realty
 *
 * Key configuration:
 * - turbopack: {} — REQUIRED for next-intl + Turbopack compatibility
 * - devIndicators: false — hides the dev indicator overlay
 * - Wrapped with createNextIntlPlugin for internationalization support
 * - Plugin reads from ./i18n/request.ts for server-side locale config
 */

import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

/* Create next-intl plugin pointing to the server-side i18n config */
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/* Next.js configuration object */
const nextConfig: NextConfig = {
  /* REQUIRED: Turbopack config — next-intl fails without this empty object */
  turbopack: {},

  /* Disable dev indicators overlay in development */
  devIndicators: false,
}

/* Export config wrapped with next-intl plugin */
export default withNextIntl(nextConfig)
