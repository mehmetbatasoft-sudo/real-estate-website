/**
 * app/api/auth/[...nextauth]/route.ts — NextAuth API route handler
 *
 * This catch-all route handles all NextAuth.js API requests:
 * - POST /api/auth/signin — processes login form submission
 * - POST /api/auth/signout — processes logout
 * - GET /api/auth/session — returns current session data
 * - GET /api/auth/csrf — returns CSRF token for forms
 *
 * The handlers are imported from the centralized auth.ts configuration.
 */

import { handlers } from '@/auth'

/* Export GET and POST handlers for NextAuth API routes */
export const { GET, POST } = handlers
