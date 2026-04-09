/**
 * app/api/upload/sign/route.ts — Cloudinary signed upload endpoint
 *
 * Returns a short-lived Cloudinary upload signature so the admin panel
 * can POST files DIRECTLY to Cloudinary, bypassing Vercel's 4.5MB body
 * size limit and Next.js 16's 10MB proxyClientMaxBodySize default.
 *
 * Why direct upload:
 *   - Vercel serverless functions cap request bodies at 4.5MB on Hobby
 *     plans, which makes uploading modern phone photos (6-25MB) impossible
 *     through a traditional server-proxied upload. Moving the bytes
 *     straight from the browser to api.cloudinary.com removes both the
 *     Vercel ceiling and the Next.js proxy buffer limit from the picture.
 *   - It's also faster (one less hop) and frees up server bandwidth.
 *
 * Security:
 *   - Admin auth check — only logged-in admins can get a signature.
 *   - Signature binds `folder` + `timestamp`, so the client cannot upload
 *     to another folder or replay the signature indefinitely (Cloudinary
 *     rejects timestamps older than ~1 hour).
 *   - The api_secret NEVER leaves the server; only the computed signature,
 *     api_key, and cloud_name are returned, which are safe for the client.
 *
 * Request: POST /api/upload/sign (no body)
 * Response: { signature, timestamp, apiKey, cloudName, folder }
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import cloudinary from '@/app/lib/cloudinary'

/**
 * POST /api/upload/sign — issue a Cloudinary upload signature
 *
 * Returns the signed params needed for a direct browser → Cloudinary upload.
 * The client includes these in the multipart form when POSTing to
 * https://api.cloudinary.com/v1_1/<cloudName>/image/upload.
 */
export async function POST() {
  try {
    /* ------------------------------------------------------------------ */
    /*  Authentication                                                     */
    /* ------------------------------------------------------------------ */

    /* Only logged-in admins may request a signature — prevents random
       visitors from uploading to our Cloudinary account. */
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    /* ------------------------------------------------------------------ */
    /*  Build the params that will be signed                               */
    /* ------------------------------------------------------------------ */

    /**
     * Timestamp (seconds since epoch) — Cloudinary uses this to expire
     * signatures. The client MUST use this exact value when uploading,
     * otherwise the signature will not match.
     */
    const timestamp = Math.round(Date.now() / 1000)

    /**
     * Params that bind the signature to a specific request.
     *
     * IMPORTANT: every key in this object must also be sent by the client
     * when it uploads; Cloudinary regenerates the signature server-side
     * from the received params and compares. Extra unsigned params are
     * allowed but anything signed here cannot be changed by the client.
     *
     * We sign `folder` so the client cannot redirect the upload to a
     * different folder, and `timestamp` so Cloudinary can enforce the
     * signature's short lifetime.
     */
    const paramsToSign: Record<string, string | number> = {
      folder: 'properties',
      timestamp,
    }

    /* ------------------------------------------------------------------ */
    /*  Generate the signature                                             */
    /* ------------------------------------------------------------------ */

    /**
     * cloudinary.utils.api_sign_request builds the SHA-1 signature over
     * the sorted, concatenated params plus the api_secret. The secret
     * never leaves the server — only the resulting hex string does.
     */
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!apiSecret) {
      console.error('Upload sign: CLOUDINARY_API_SECRET is not configured')
      return NextResponse.json(
        { error: 'Yükleme yapılandırması eksik. Lütfen sistem yöneticisine bildirin.' },
        { status: 500 }
      )
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)

    /* ------------------------------------------------------------------ */
    /*  Return the signed upload envelope                                  */
    /* ------------------------------------------------------------------ */

    /**
     * apiKey and cloudName are PUBLIC — Cloudinary designed them to be
     * embedded in client code. The real secret is api_secret, which is
     * only used on the server to generate `signature`.
     */
    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder: 'properties',
    })
  } catch (error) {
    /**
     * Catch-all — we always return JSON so the client can reliably parse
     * the response. The real error is logged for post-mortem debugging.
     */
    console.error('Upload sign: failed to generate signature', error)
    return NextResponse.json(
      { error: 'İmza oluşturulamadı. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
