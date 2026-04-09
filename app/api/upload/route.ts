/**
 * app/api/upload/route.ts — Image upload API
 *
 * Handles POST requests for uploading images to Cloudinary.
 * Used by the admin panel for property images and agent photos.
 *
 * Upload flow:
 * 1. Check authentication (admin only)
 * 2. Validate file type (jpg, png, webp, gif, heic — iPhones shoot HEIC by default)
 * 3. Validate file size (max 10MB — modern phone photos routinely exceed 5MB)
 * 4. Upload to Cloudinary via upload_stream
 * 5. Return publicId and secureUrl
 *
 * Error responses:
 *   All error messages are in Turkish to match the Turkish-only admin panel.
 *   The response always carries `{ error: string }` so the client can show
 *   a useful message. Server-side failures also log the real exception via
 *   console.error for post-mortem debugging.
 *
 * Security:
 *   - Auth required — valid NextAuth session
 *   - File type whitelist — only image formats accepted
 *   - File size limit — 10MB max
 *   - Cloudinary format restriction enforced server-side
 *
 * Content-Type: multipart/form-data, field name: 'file'
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import cloudinary from '@/app/lib/cloudinary'

/**
 * Allowed image MIME types — whitelist for security.
 *
 * Includes HEIC/HEIF because iPhones shoot in HEIC by default since iOS 11
 * and users frequently drag those straight from Photos.app into the admin
 * panel. Cloudinary auto-transcodes HEIC to JPG on ingest so the public
 * site never has to deal with the format.
 */
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]

/**
 * Maximum file size in bytes — 10MB.
 *
 * The previous 5MB cap rejected most modern phone photos (iPhone HEIC ~3MB,
 * iPhone JPG ~6-8MB, Samsung JPG ~5-10MB). 10MB comfortably covers phone
 * photos while still blocking DSLR RAW-ish files.
 */
const MAX_SIZE = 10 * 1024 * 1024

/**
 * POST /api/upload — Upload an image to Cloudinary
 *
 * Always returns a JSON body — never HTML — even on failure, so the
 * client can safely `await response.json()` without throwing.
 *
 * Requires authentication, validates type and size.
 * Returns on success: { publicId, secureUrl }
 * Returns on failure: { error: '<Turkish message>' } with an appropriate status
 */
export async function POST(request: NextRequest) {
  try {
    /* Check authentication — reject if not logged in */
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    /**
     * Parse the multipart form data.
     * Wrapped in its own try so that malformed form data returns a clean
     * JSON error instead of crashing through to the outer catch (which would
     * otherwise mask the real cause behind the generic "upload failed").
     */
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error('Upload: failed to parse form data', error)
      return NextResponse.json(
        { error: 'Dosya okunamadı. Lütfen tekrar deneyin.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null

    /* Validate that a file was provided */
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı.' },
        { status: 400 }
      )
    }

    /**
     * Validate file type against whitelist.
     *
     * We read `file.type` lower-cased so that "IMAGE/JPEG" (rare but
     * reported on some Windows browsers when dragging from the Photos app)
     * matches our lowercase whitelist.
     */
    const fileType = (file.type || '').toLowerCase()
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          error: `Geçersiz dosya türü. Yalnızca JPG, PNG, WebP, GIF ve HEIC dosyaları yüklenebilir. (Tespit edilen: ${file.type || 'bilinmiyor'})`,
        },
        { status: 400 }
      )
    }

    /* Validate file size — 10MB cap */
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      return NextResponse.json(
        {
          error: `Dosya çok büyük (${sizeMb} MB). Maksimum dosya boyutu 10 MB'dır.`,
        },
        { status: 400 }
      )
    }

    /* Convert the file to a buffer for Cloudinary upload */
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    /**
     * Upload to Cloudinary using upload_stream.
     *
     * Notes on the options:
     *   - folder: 'properties' keeps everything under a single Cloudinary folder
     *   - resource_type: 'image' enforces image semantics (no raw/video)
     *   - allowed_formats lists the formats Cloudinary will accept AFTER its
     *     own content sniffing. HEIC is included so iPhone uploads survive
     *     Cloudinary's validator; Cloudinary then auto-transcodes it on delivery.
     */
    const result = await new Promise<{ public_id: string; secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'properties',           /* All images go to properties/ folder */
            resource_type: 'image',          /* Enforce image resource type */
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'],
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
    /**
     * Catch-all error handler — ensures the client always receives a JSON
     * body even for unexpected failures (Cloudinary outage, network issues,
     * module loading errors, etc.).
     *
     * The full error is logged server-side so we can diagnose the real cause
     * after the fact; the client only sees a friendly Turkish message.
     */
    console.error('Upload failed:', error)

    /* Try to extract a useful message from the error (Cloudinary errors
       often carry a `.message` property with the actual failure reason) */
    const details =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''

    return NextResponse.json(
      {
        error: details
          ? `Yükleme başarısız: ${details}`
          : 'Yükleme başarısız. Lütfen tekrar deneyin.',
      },
      { status: 500 }
    )
  }
}
