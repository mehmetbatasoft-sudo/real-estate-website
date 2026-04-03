/**
 * auth.ts — NextAuth v5 configuration for Özgül's Realty
 *
 * Authentication setup using NextAuth.js v5 (beta) with Credentials provider.
 * This is a single-admin system — only one admin user exists in the database.
 *
 * Authentication flow:
 * 1. Admin navigates to /[locale]/nmo-bbo-141522/login
 * 2. Enters email + password
 * 3. Credentials provider verifies against Admin table (bcrypt compare)
 * 4. Session created with JWT strategy
 * 5. proxy.ts middleware protects all admin routes
 *
 * Three-layer security:
 * - Layer 1: proxy.ts middleware (redirects before page loads)
 * - Layer 2: Each admin page.tsx checks auth() independently
 * - Layer 3: Every mutating API route checks auth() before processing
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/app/lib/prisma'

/**
 * NextAuth configuration
 * Exports: handlers (GET/POST), auth (session checker), signIn, signOut
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  /* Use JWT strategy — no database session table needed */
  session: { strategy: 'jwt' },

  /* Custom login page — redirects to Turkish-only admin login */
  pages: {
    signIn: '/en/nmo-bbo-141522/login',
  },

  /* Authentication providers — Credentials only (no OAuth) */
  providers: [
    Credentials({
      /* Define the expected credentials fields */
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      /**
       * Authorize function — validates credentials against the database
       * Returns user object on success, null on failure
       */
      async authorize(credentials) {
        /* Validate that both email and password are provided */
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        /* Look up the admin user by email */
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
        })

        /* Return null if admin not found or has no password set */
        if (!admin || !admin.password) {
          return null
        }

        /* Compare provided password with stored bcrypt hash */
        const isPasswordValid = await compare(
          credentials.password as string,
          admin.password
        )

        /* Return null if password doesn't match */
        if (!isPasswordValid) {
          return null
        }

        /* Return the user object — included in the JWT token */
        return {
          id: String(admin.id),
          name: admin.name,
          email: admin.email,
          image: admin.image,
        }
      },
    }),
  ],

  /* Callbacks to customize JWT and session behavior */
  callbacks: {
    /**
     * JWT callback — adds user ID to the token
     * Called when JWT is created or updated
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    /**
     * Session callback — adds user ID to the session
     * Called when session is checked (auth() function)
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
