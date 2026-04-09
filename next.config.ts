/**
 * next.config.ts — Next.js configuration for Özgül's Realty
 *
 * Key configuration:
 * - turbopack: {} — REQUIRED for next-intl + Turbopack compatibility
 * - devIndicators: false — hides the dev indicator overlay
 * - experimental.proxyClientMaxBodySize — raised from the 10MB default so
 *   the dev server's proxy.ts middleware doesn't silently truncate large
 *   requests. Not the primary fix for image uploads (those now go directly
 *   to Cloudinary from the browser via app/api/upload/sign), but a
 *   belt-and-suspenders guard in case another future endpoint needs to
 *   accept large bodies.
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

  /**
   * Experimental: raise the proxy's client request body buffer cap.
   *
   * Next.js 16 introduced proxy.ts (replacing middleware.ts) and along
   * with it a 10MB default on how much of a request body can be buffered
   * for the proxy to inspect. When a request body exceeds the limit the
   * proxy truncates it silently and the route handler sees a malformed
   * multipart body — which used to surface as HTTP 413 for our 25MB
   * phone photo uploads in development.
   *
   * Uploads now go directly from the browser to Cloudinary (see
   * app/components/admin/ImageUpload.tsx), so this ceiling no longer
   * matters for the upload path. We still raise it to 50mb as a safety
   * net for any future endpoint that might legitimately need to accept
   * a larger-than-10MB body (e.g., CSV bulk imports).
   */
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
}

/* Export config wrapped with next-intl plugin */
export default withNextIntl(nextConfig)
