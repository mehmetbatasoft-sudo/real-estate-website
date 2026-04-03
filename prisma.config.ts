/**
 * prisma.config.ts — Prisma v7 configuration for Özgül's Realty
 *
 * Prisma v7 moved connection URL configuration from schema.prisma to this file.
 * This file tells Prisma CLI where to find the schema and how to connect
 * to the database for migrations and schema pushes.
 *
 * The DATABASE_URL environment variable connects to Neon PostgreSQL.
 * We load .env.local since Next.js uses that file (not .env).
 */

import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

/* Load environment variables from .env.local (Next.js convention) */
config({ path: path.join(__dirname, '.env.local') })

/* Define Prisma configuration with schema path and database URL */
export default defineConfig({
  /* Path to the Prisma schema file (in prisma/ subdirectory) */
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  /* Seed command — runs prisma/seed.ts with ts-node */
  migrations: {
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },

  /* Database connection for Prisma CLI (migrations, db push, seed) */
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
