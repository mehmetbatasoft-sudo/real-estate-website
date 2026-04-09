/**
 * app/lib/cloudinary.ts — Cloudinary v2 configuration singleton for Özgül's Realty
 *
 * Configures the Cloudinary SDK for server-side operations:
 * - Generating signed upload envelopes in app/api/upload/sign/route.ts
 *   (the admin panel then POSTs files DIRECTLY to Cloudinary from the
 *   browser, bypassing Vercel's 4.5MB request-body ceiling)
 * - Deleting orphaned images when properties are removed
 *
 * Client-side image display uses next-cloudinary's CldImage component
 * with NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (no API key needed on client).
 *
 * Usage: import cloudinary from '@/app/lib/cloudinary'
 */

import { v2 as cloudinary } from 'cloudinary'

/**
 * Configure Cloudinary with environment variables
 * - cloud_name: identifies your Cloudinary account
 * - api_key: for authenticated API calls (server-side only)
 * - api_secret: secret key for signing requests (server-side only)
 */
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/* Default export for convenient importing */
export default cloudinary
