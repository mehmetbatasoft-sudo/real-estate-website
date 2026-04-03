/**
 * app/lib/prisma.ts — Prisma client singleton for Özgül's Realty
 *
 * Uses the globalThis pattern to prevent multiple PrismaClient instances
 * during hot module reloading in development. Without this pattern,
 * each hot reload would create a new database connection, eventually
 * exhausting the connection pool (especially on Neon's free tier).
 *
 * In production, only one instance is created since there's no hot reloading.
 *
 * Prisma v7: Uses @prisma/adapter-neon (WebSocket mode) for database connections.
 * Supports transactions needed by upsert and other complex queries.
 *
 * Usage: import prisma from '@/app/lib/prisma'
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

/**
 * Extend globalThis to include a prisma property
 * This allows us to store the singleton across hot reloads
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Create a Prisma client with Neon WebSocket adapter
 * PrismaNeon takes a PoolConfig object with the connection string
 */
function createPrismaClient(): PrismaClient {
  /* Create Neon adapter with connection string from environment */
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })

  /* Return PrismaClient with the Neon adapter */
  return new PrismaClient({ adapter })
}

/**
 * Create or reuse the PrismaClient singleton
 * - In development: reuses the instance stored on globalThis
 * - In production: creates a new instance (only happens once)
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

/* Store the instance on globalThis in development to survive hot reloads */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/* Default export for convenient importing */
export default prisma
