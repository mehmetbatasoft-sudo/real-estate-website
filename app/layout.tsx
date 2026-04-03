/**
 * app/layout.tsx — Root layout for Özgül's Realty
 *
 * This is the top-level layout that wraps ALL pages (public + admin).
 * Responsibilities:
 * - Imports global CSS (design tokens, Tailwind, fonts)
 * - Passes children through without wrapping in html/body
 *   (html/body are set in app/[locale]/layout.tsx with locale-aware attributes)
 *
 * Note: Locale-specific providers (NextIntlClientProvider, fonts, dir attribute)
 * are handled in app/[locale]/layout.tsx, not here.
 */

/* Import global styles including Tailwind v4, design tokens, and fonts */
import './globals.css'

/**
 * RootLayout — top-level layout component
 * Simply passes children through; locale layout handles html/body tags
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
