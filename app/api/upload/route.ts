/**
 * app/api/upload/route.ts — Image upload API
 *
 * Handles POST requests for uploading images to Cloudinary.
 * Used by the admin panel for property images and agent photos.
 *
 * Upload flow:
 * 1. Check authentication (admin only)
 * 2. Validate file type (jpg, png, webp, gif only)
 * 3. Validate file size (max 5MB)
 * 4. Upload to Cloudinary via upload_stream
 * 5. Return publicId and secureUrl
 *
 * Security:
 * - Auth required — valid NextAuth session
 * - File type whitelist — only image formats accepted
 * - File size limit — 5MB max
 * - Cloudinary format restriction enforced server-side
 *
 * Content-Type: multipart/form-data, field name: 'file'
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import cloudinary from '@/app/lib/cloudinary'

/* Allowed image MIME types — whitelist for security */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/* Maximum file size in bytes — 5MB */
const MAX_SIZE = 5 * 1024 * 1024

/**
 * POST /api/upload — Upload an image to Cloudinary
 * Requires authentication, validates type and size
 * Returns: { publicId, secureUrl }
 */
export async function POST(request: NextRequest) {
  try {
    /* Check authentication — reject if not logged in */
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* Parse the multipart form data */
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    /* Validate that a file was provided */
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    /* Validate file type against whitelist */
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    /* Validate file size — max 5MB */
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    /* Convert the file to a buffer for Cloudinary upload */
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    /* Upload to Cloudinary using upload_stream */
    const result = await new Promise<{ public_id: string; secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'properties',           /* All images go to properties/ folder */
            resource_type: 'image',          /* Enforce image resource type */
            allowed_formats: ['jpg', 'png', 'webp', 'gif'], /* Server-side format restriction */
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result as { public_id: string; secure_url: string })
          }
        )

        /* Write the buffer to the upload stream */
        uploadStream.end(buffer)
      }
    )

    /* Return the Cloudinary public ID and secure URL */
    return NextResponse.json({
      publicId: result.public_id,
      secureUrl: result.secure_url,
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
