/**
 * proxy.ts — Combined middleware for Özgül's Realty
 *
 * CRITICAL: This file MUST be named proxy.ts, NOT middleware.ts
 * This is a Next.js 16+ requirement for custom middleware.
 *
 * Combines two middleware functions in a single file:
 * 1. NextAuth — protects admin routes (/nmo-bbo-141522/*)
 * 2. next-intl — handles locale routing for all public routes
 *
 * Authentication flow:
 * - If the URL contains '/nmo-bbo-141522' (admin section)
 *   AND it's NOT the login page
 *   AND the user is NOT logged in
 *   → Redirect to the admin login page
 * - Otherwise, pass through to next-intl for locale handling
 *
 * The matcher ensures this middleware runs on all page routes
 * but skips API routes, static files, and Next.js internals.
 */

import { auth } from './auth'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import createMiddleware from 'next-intl/middleware'

/* Create the next-intl middleware for locale routing */
const intlMiddleware = createMiddleware(routing)

/**
 * Combined middleware — auth wraps the entire middleware function
 * The auth() wrapper provides req.auth with the current session
 */
export default auth((req) => {
  /* Check if the current route is an admin route */
  const isAdminRoute = req.nextUrl.pathname.includes('/nmo-bbo-141522')

  /* Check if the current route is the admin login page (always accessible) */
  const isLoginPage = req.nextUrl.pathname.includes('/nmo-bbo-141522/login')

  /* Check if the user has a valid authentication session */
  const isLoggedIn = !!req.auth

  /**
   * Admin route protection:
   * If accessing admin route (not login page) without authentication,
   * redirect to the admin login page
   */
  if (isAdminRoute && !isLoginPage && !isLoggedIn) {
    const loginUrl = new URL('/en/nmo-bbo-141522/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  /* Pass all requests through next-intl middleware for locale handling */
  return intlMiddleware(req)
})

/**
 * Middleware matcher configuration
 * Matches all routes EXCEPT:
 * - /api/* — API routes (handled separately)
 * - /trpc/* — tRPC routes (if used)
 * - /_next/* — Next.js internals (static files, chunks)
 * - /_vercel/* — Vercel internals
 * - Files with extensions (images, favicon, etc.)
 */
export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)',]
}
