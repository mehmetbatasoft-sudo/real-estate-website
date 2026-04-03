/**
 * i18n/request.ts — Server-side i18n configuration
 *
 * This file is referenced by next.config.ts via createNextIntlPlugin.
 * It provides the message loading logic for server components.
 *
 * Each locale's messages are imported manually (not dynamically) to ensure
 * proper tree-shaking and type safety. The hasLocale function validates
 * the requested locale before loading messages.
 */

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

/* Export the request config for next-intl server components */
export default getRequestConfig(async ({ requestLocale }) => {
  /* Get the requested locale from the URL */
  const requested = await requestLocale

  /* Validate the locale — fall back to default if invalid */
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  /* Load the appropriate translation messages for the validated locale */
  const messages = (await import(`../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
