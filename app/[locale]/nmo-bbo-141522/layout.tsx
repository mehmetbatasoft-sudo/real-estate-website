/**
 * app/[locale]/nmo-bbo-141522/layout.tsx — Admin Panel Layout
 *
 * Server component that wraps ALL admin panel pages with a consistent layout.
 * This layout is nested inside the locale layout (app/[locale]/layout.tsx),
 * so it inherits fonts, i18n provider, and global styles.
 *
 * Key decisions:
 * - NO Navbar component — admin has its own header built into AdminDashboard
 * - Uses 'adminWrapper' class from globals.css for consistent cream background
 * - Minimal layout — just a wrapping div with background and min-height
 * - Metadata sets a Turkish title since admin UI is Turkish-only
 *
 * Route: /[locale]/nmo-bbo-141522/*
 * The URL segment is intentionally obscure for security (not truly secret,
 * but not discoverable via navigation or sitemap).
 */

import { Metadata } from 'next'

/**
 * Admin panel metadata
 * Title is in Turkish since the admin UI is entirely Turkish
 * This overrides the locale layout's title template for admin pages
 */
export const metadata: Metadata = {
  title: 'Admin Panel — Özgül\'s Realty',
}

/**
 * AdminLayout — wraps all admin pages with the adminWrapper class
 * The adminWrapper class (defined in globals.css) provides:
 * - min-height: 100vh (full viewport height)
 * - background: var(--color-cream) (#FDFAF4)
 * - margin: 0 (removes any inherited margins)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /* adminWrapper class from globals.css — cream background, full height */
    <div className="adminWrapper">
      {children}
    </div>
  )
}
