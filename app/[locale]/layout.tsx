/**
 * app/[locale]/layout.tsx — Locale-aware layout for Özgül's Realty
 *
 * This layout wraps all pages within a specific locale (en, tr, ru, ar).
 * Responsibilities:
 * - Validates the requested locale against supported locales
 * - Sets the HTML lang and dir attributes (RTL for Arabic)
 * - Loads Cormorant Garamond font via next/font/google
 * - Wraps children with NextIntlClientProvider for translations
 * - Includes Navbar, SmoothScroll, and CookieBanner components
 * - Applies overflow-x: hidden to prevent horizontal scroll
 *
 * Note: The Navbar component self-hides on admin routes.
 */

import { Cormorant_Garamond, Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'

/**
 * Load Cormorant Garamond font — the luxury serif font used throughout the site
 * Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
 * Includes italic variants for emphasis text
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

/**
 * Load Inter — modern, highly readable sans-serif for body text and UI
 * Used for navigation, buttons, forms, and paragraph copy
 * Pairs with Cormorant Garamond (headings) for a classic luxury look
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Generate metadata for the locale layout
 * Sets the base title template for all pages under this locale
 */
export async function generateMetadata() {
  return {
    title: {
      template: '%s — Oriva',
      default: 'Oriva',
    },
    description: 'Luxury real estate properties in Antalya, Turkey. Find your dream home on the Turkish Riviera with Özgül Pekşen.',
  }
}

/**
 * LocaleLayout — the main layout for all locale-specific pages
 * Handles locale validation, RTL support, font loading, and i18n provider
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  /* Await the locale parameter from the URL */
  const { locale } = await params

  /* Validate the locale — show 404 if not supported */
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  /* Load all translation messages for the current locale */
  const messages = await getMessages()

  /* Determine if the locale is RTL (Arabic) */
  const isRTL = locale === 'ar'

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${cormorant.variable} ${inter.variable}`}
    >
      {/* Body with overflow-x hidden to prevent horizontal scroll */}
      <body style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
        {/* NextIntlClientProvider makes translations available to all client components */}
        <NextIntlClientProvider messages={messages}>
          {/* Page content — Navbar and other global components added later */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
