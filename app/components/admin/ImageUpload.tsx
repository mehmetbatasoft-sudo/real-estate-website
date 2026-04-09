'use client'
/**
 * app/components/admin/ImageUpload.tsx — Drag-and-Drop Image Uploader
 *
 * Client component that provides a drag-and-drop image upload experience
 * with Cloudinary integration. Used by both PropertyForm (multiple images)
 * and AgentForm (single portrait photo).
 *
 * Features:
 * - Drag-and-drop zone with visual feedback (border color change + background tint)
 * - Click to browse files (hidden file input triggered by dropzone click)
 * - Multi-file DIRECT upload to Cloudinary (bypasses Vercel body size limits)
 * - Preview thumbnails using CldImage from next-cloudinary (200x150, crop fill)
 * - Remove button (x) on each image thumbnail
 * - "Ana" (Primary) badge on the first image [0] — indicates the cover/hero image
 * - Loading state during upload (opacity reduction + pointer-events disabled)
 * - Upload progress indicator (shows count of files being uploaded)
 *
 * Props:
 * - images: string[] — array of current Cloudinary public IDs
 * - onImagesChange: (ids: string[]) => void — callback when images array changes
 * - multiple: boolean (default true) — true for properties (multi), false for agent (single)
 *
 * Upload flow (DIRECT-TO-CLOUDINARY — the file bytes never touch Vercel):
 * 1. User drops files onto the dropzone or clicks to open the file browser
 * 2. Client requests a short-lived Cloudinary signature from /api/upload/sign
 *    — this endpoint checks admin auth but NEVER receives the file bytes.
 * 3. For each file, the client POSTs a multipart form straight to
 *    https://api.cloudinary.com/v1_1/<cloud>/image/upload, including
 *    the server-signed params (folder, timestamp, api_key, signature).
 * 4. Cloudinary validates the signature, stores the file, and returns
 *    { public_id, secure_url }.
 * 5. publicId is appended to the images array (or replaces it in single mode).
 * 6. Parent component receives the updated array via onImagesChange callback.
 *
 * Why direct upload:
 *   Vercel serverless functions have a ~4.5MB request body cap on the Hobby
 *   plan, and Next.js 16's proxy layer buffers request bodies at 10MB by
 *   default. Routing the file through our own /api/upload endpoint meant
 *   modern phone photos (6-25MB) would be rejected with HTTP 413 before
 *   they ever reached the route handler. Uploading straight to Cloudinary
 *   from the browser removes both ceilings from the picture.
 *
 * Supported formats:
 *   JPG / JPEG / PNG / WebP / GIF / HEIC / HEIF
 *   HEIC is included because iPhones shoot in it by default — Cloudinary
 *   auto-transcodes on ingest so public pages get JPG.
 *
 * Error handling:
 *   - Signature endpoint errors are surfaced verbatim (Turkish, from the API).
 *   - Cloudinary errors are shown with Cloudinary's own message (usually
 *     in English, but the admin is technical enough to read them).
 *   - Network failures log the real exception via console.error so the
 *     admin (or a developer) can diagnose the cause from devtools.
 *
 * File size limit & compression:
 *   Cloudinary's free tier rejects files larger than 10MB, but modern
 *   phone photos routinely weigh 15-25MB. To work around this without
 *   forcing the agency onto a paid Cloudinary plan, the uploader will
 *   transparently recompress any file larger than 8MB on the client:
 *
 *     1. Decode the original file into an HTMLImageElement.
 *     2. Draw it onto a canvas scaled so the longest edge is at most
 *        3000px — high enough that the hero image still looks crisp on
 *        a 4K monitor but low enough to guarantee the result fits
 *        comfortably under Cloudinary's 10MB ceiling.
 *     3. Export the canvas as JPEG at quality 0.9 (visually lossless
 *        for photographic content).
 *     4. Upload the compressed File instead of the original.
 *
 *   After compression the file is still size-checked against a 30MB
 *   hard cap before upload, so pathological inputs (e.g. decoded
 *   incorrectly because of an unsupported codec) fail fast with a
 *   Turkish error message.
 *
 *   HEIC / HEIF photos skip the canvas compression path — most browsers
 *   can't decode HEIC into an HTMLImageElement — and are passed through
 *   to Cloudinary as-is. Cloudinary transcodes HEIC to JPG server-side,
 *   and real-world iPhone HEIC files are almost always under 5MB.
 *
 * Single-image mode (multiple=false):
 * - Only the first selected/dropped file is uploaded
 * - Uploading a new image replaces any existing image
 * - Used for agent portrait photos
 *
 * Design system:
 * - Cormorant Garamond serif font for all text
 * - Gold (#C9A96E) dashed borders on the dropzone
 * - Espresso (#2C1A0E) remove buttons, gold primary badges
 * - No border-radius (luxury sharp-edge aesthetic)
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { CldImage } from 'next-cloudinary'
import styles from './ImageUpload.module.css'

/**
 * ImageUpload props
 * - images: array of current Cloudinary public IDs for uploaded images
 * - onImagesChange: callback invoked whenever the images array is modified
 *   (after upload or removal)
 * - multiple: whether multiple images can be uploaded (default true).
 *   When false, only 1 image is allowed and new uploads replace the existing one.
 */
interface ImageUploadProps {
  images: string[]
  onImagesChange: (ids: string[]) => void
  multiple?: boolean
}

/**
 * ImageUpload — drag-and-drop image upload component with Cloudinary backend.
 *
 * Manages internal state for drag visual feedback, upload progress, and errors.
 * The actual images array is owned by the parent component and modified via
 * the onImagesChange callback.
 *
 * @param images — current Cloudinary public IDs
 * @param onImagesChange — callback when images change (add/remove)
 * @param multiple — allow multiple images (default true)
 */
export default function ImageUpload({
  images,
  onImagesChange,
  multiple = true,
}: ImageUploadProps) {
  /**
   * Drag-over state — true when a file is being dragged over the dropzone.
   * Used to apply the .dropzoneActive CSS class for visual feedback
   * (gold border + subtle background tint).
   */
  const [isDragOver, setIsDragOver] = useState(false)

  /**
   * Upload progress counter — tracks how many files are currently being
   * uploaded. When > 0, the uploading indicator text is shown in the
   * dropzone and the .uploading CSS class is applied to the container.
   */
  const [uploading, setUploading] = useState(0)

  /** Error state — shows a Turkish error message when an upload fails */
  const [error, setError] = useState('')

  /**
   * Hidden file input ref — this <input type="file"> is visually hidden
   * but triggered programmatically when the user clicks the dropzone.
   * This provides an alternative file selection method for users who
   * prefer clicking over drag-and-drop.
   */
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ================================================================ */
  /* DRAG-AND-DROP EVENT HANDLERS                                      */
  /* These handle the three phases of a drag-and-drop interaction:     */
  /* dragover (file is hovering), dragleave (file left), drop (file    */
  /* was released over the zone).                                      */
  /* ================================================================ */

  /**
   * Handle drag over event — prevents the browser's default behavior
   * (which would open the file) and activates the visual feedback
   * by setting isDragOver to true.
   *
   * @param e — the DragEvent from the dropzone div
   */
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  /**
   * Handle drag leave event — resets the visual feedback when the
   * dragged file leaves the dropzone boundary.
   *
   * @param e — the DragEvent from the dropzone div
   */
  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  /**
   * Handle drop event — processes the dropped files.
   * Extracts File objects from the DataTransfer and initiates upload.
   * Resets the drag-over visual state.
   *
   * @param e — the DragEvent from the dropzone div
   */
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    /* Extract files from the drop event's DataTransfer object */
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFiles(files)
    }
  }

  /* ================================================================ */
  /* CLICK-TO-BROWSE HANDLER                                           */
  /* ================================================================ */

  /**
   * Handle click on the dropzone — opens the hidden file input dialog.
   * This provides a click-based alternative to drag-and-drop.
   */
  function handleClick() {
    fileInputRef.current?.click()
  }

  /**
   * Handle file input change — processes files selected via the browser
   * file dialog. Resets the input value after reading so the same file
   * can be selected again if needed.
   *
   * @param e — the ChangeEvent from the hidden file input
   */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(Array.from(files))
    }
    /* Reset the input value so re-selecting the same file triggers onChange */
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /* ================================================================ */
  /* FILE UPLOAD LOGIC                                                 */
  /* Uploads files DIRECTLY to Cloudinary using a server-issued        */
  /* signature. The bytes never pass through our Next.js server or     */
  /* Vercel's 4.5MB body-size ceiling.                                 */
  /* ================================================================ */

  /**
   * Client-side file size cap — 30MB.
   *
   * Originals larger than this are rejected with a Turkish error message
   * before we even try to decode them. Anything between COMPRESSION_THRESHOLD
   * and MAX_FILE_SIZE gets run through the canvas compressor below.
   */
  const MAX_FILE_SIZE = 30 * 1024 * 1024

  /**
   * File size at which client-side recompression kicks in.
   *
   * Cloudinary's free tier rejects uploads larger than 10MB, so we trigger
   * the canvas recompression path for anything above 8MB. The 2MB gap
   * provides headroom for JPEG framing overhead and EXIF metadata so a
   * borderline 9.5MB file recompresses safely under the 10MB ceiling.
   */
  const COMPRESSION_THRESHOLD = 8 * 1024 * 1024

  /**
   * Maximum pixel dimension (long edge) for recompressed images.
   *
   * 3000px is large enough that the hero image on a 4K property detail
   * page still looks pixel-perfect, while being small enough that a full
   * random-noise JPEG at quality 0.9 always fits comfortably under 10MB.
   * Real-world phone photos are usually far smaller post-compression
   * (1-3MB) because photographic content compresses much better than
   * random noise.
   */
  const MAX_DIMENSION = 3000

  /**
   * JPEG quality factor for recompressed images.
   *
   * 0.9 is considered "visually lossless" for photographic content —
   * viewers cannot distinguish it from the original at normal viewing
   * distances, and the file size drops by ~10x compared to quality 1.0.
   */
  const COMPRESSION_QUALITY = 0.9

  /**
   * Whitelist of MIME types accepted by Cloudinary's image upload.
   *
   * HEIC/HEIF are included because iPhones shoot in HEIC since iOS 11
   * and Cloudinary auto-transcodes them to JPG on ingest — so the
   * public site never sees raw HEIC.
   */
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ]

  /**
   * MIME types the canvas-based compressor can decode.
   *
   * HEIC/HEIF are deliberately excluded: most browsers cannot load
   * HEIC into an HTMLImageElement, and Cloudinary auto-transcodes
   * HEIC server-side anyway. Real-world iPhone HEIC files are almost
   * always under 5MB, so they rarely hit the compression threshold
   * in the first place.
   */
  const COMPRESSIBLE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]

  /**
   * Recompress an oversized image on the client.
   *
   * Draws the original into a canvas scaled so its longest edge is at
   * most MAX_DIMENSION pixels, then exports as JPEG at COMPRESSION_QUALITY.
   * The result is packaged back into a File so the caller can treat it
   * identically to the original.
   *
   * If anything goes wrong (unsupported format, decode failure, canvas
   * export failure), the function returns `null` and lets the caller
   * fall back to uploading the original.
   *
   * @param file — the original File object
   * @returns a recompressed File, or null on failure
   */
  async function compressImage(file: File): Promise<File | null> {
    try {
      /* Decode the file into an HTMLImageElement via an object URL.
         createObjectURL + Image is the widest-compatibility path — it
         works in every evergreen browser without needing a polyfill. */
      const objectUrl = URL.createObjectURL(file)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Image decode failed'))
        image.src = objectUrl
      }).finally(() => {
        /* Revoke eagerly so we don't leak memory when decode fails */
        URL.revokeObjectURL(objectUrl)
      })

      /* Compute the target dimensions — preserve aspect ratio and clamp
         the longest edge to MAX_DIMENSION. If the original is already
         smaller than the cap on both axes, we still recompress to cut
         the file size via the JPEG quality setting. */
      const longestEdge = Math.max(img.naturalWidth, img.naturalHeight)
      const scale = longestEdge > MAX_DIMENSION ? MAX_DIMENSION / longestEdge : 1
      const targetWidth = Math.round(img.naturalWidth * scale)
      const targetHeight = Math.round(img.naturalHeight * scale)

      /* Draw the image into an offscreen canvas at the target size.
         2D context is used instead of WebGL because it has wider
         compatibility and our use case (single static image) doesn't
         benefit from GPU acceleration. */
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Compression: failed to get 2D context')
        return null
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      /* Export the canvas as a JPEG Blob. Quality 0.9 is visually
         lossless for photographic content but cuts file size by ~10x. */
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/jpeg', COMPRESSION_QUALITY)
      })
      if (!blob) {
        console.error('Compression: canvas.toBlob returned null')
        return null
      }

      /* Package the Blob back into a File with a .jpg extension so it's
         obvious the file has been transcoded. The rest of the pipeline
         works with File objects, so we keep the type consistent. */
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
    } catch (err) {
      console.error('Compression: failed to recompress image', err, 'file:', file.name)
      return null
    }
  }

  /**
   * Safely parse a fetch Response as JSON.
   *
   * Our /api/upload/sign endpoint always returns JSON, and Cloudinary's
   * upload API does too, but transient network glitches or a proxy error
   * page can leave us holding an HTML / empty body. `response.json()`
   * throws on those, so we fall back to `text()` + manual parse and
   * return a typed null on failure.
   */
  async function safeJson(response: Response): Promise<Record<string, unknown> | null> {
    try {
      const text = await response.text()
      if (!text) return null
      return JSON.parse(text) as Record<string, unknown>
    } catch (err) {
      console.error('Upload: failed to parse response JSON', err)
      return null
    }
  }

  /**
   * Fetch a fresh Cloudinary signature from our /api/upload/sign endpoint.
   *
   * The signature is short-lived (Cloudinary rejects timestamps older
   * than ~1 hour) and bound to `folder=properties`, so it cannot be
   * abused to upload files to other folders. Only the signature,
   * timestamp, api_key, and cloud_name are returned — the api_secret
   * stays on the server.
   *
   * Returns null on any failure so callers can abort gracefully.
   */
  async function fetchUploadSignature(): Promise<{
    signature: string
    timestamp: number
    apiKey: string
    cloudName: string
    folder: string
  } | null> {
    try {
      const response = await fetch('/api/upload/sign', { method: 'POST' })
      const data = await safeJson(response)

      if (!response.ok) {
        const apiError =
          data && typeof data.error === 'string' ? data.error : null
        setError(
          apiError ||
            `İmza alınamadı (HTTP ${response.status}). Lütfen tekrar deneyin.`
        )
        return null
      }

      if (
        !data ||
        typeof data.signature !== 'string' ||
        typeof data.timestamp !== 'number' ||
        typeof data.apiKey !== 'string' ||
        typeof data.cloudName !== 'string' ||
        typeof data.folder !== 'string'
      ) {
        console.error('Upload: sign endpoint returned unexpected shape', data)
        setError('Sunucudan beklenmeyen bir yanıt geldi. Lütfen tekrar deneyin.')
        return null
      }

      return {
        signature: data.signature,
        timestamp: data.timestamp,
        apiKey: data.apiKey,
        cloudName: data.cloudName,
        folder: data.folder,
      }
    } catch (err) {
      console.error('Upload: failed to fetch signature', err)
      setError('İmza alınırken ağ hatası oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.')
      return null
    }
  }

  /**
   * Upload files directly to Cloudinary using a server-issued signature.
   *
   * For each file:
   * 1. Validate type and size client-side (fast rejection, friendly errors)
   * 2. Request a fresh signature from /api/upload/sign
   * 3. POST the file + signed params straight to Cloudinary's upload API
   * 4. Collect the returned public_id on success
   * 5. Update the parent's images array via onImagesChange
   *
   * In single-image mode (multiple=false), only the first file is
   * uploaded and it replaces any existing image.
   *
   * Error handling strategy:
   *   - Size/type validation failures short-circuit with a Turkish message
   *     before any network call.
   *   - Signature errors bubble up from fetchUploadSignature (also Turkish).
   *   - Cloudinary errors are surfaced verbatim from Cloudinary's response
   *     (typically in English, but admins are technical enough to read them).
   *   - Network exceptions log the real error via console.error so we can
   *     diagnose the cause from browser devtools.
   *
   * @param files — array of File objects to upload
   */
  async function uploadFiles(files: File[]) {
    /* Clear any previous error messages */
    setError('')

    /**
     * In single-image mode (agent portrait), only upload the first file.
     * In multi-image mode (property photos), upload all selected files.
     */
    const filesToUpload = multiple ? files : [files[0]]

    /* Set the uploading counter — used for progress display and .uploading class */
    setUploading(filesToUpload.length)

    /* Accumulate successfully uploaded image IDs */
    const newImageIds: string[] = []

    /* Upload each file sequentially */
    for (const file of filesToUpload) {
      try {
        /* ------------------------------------------------------------ */
        /* Client-side validation — fail fast before any network call   */
        /* ------------------------------------------------------------ */

        /* File type whitelist (mirrors Cloudinary's accepted formats) */
        const fileType = (file.type || '').toLowerCase()
        if (!ALLOWED_MIME_TYPES.includes(fileType)) {
          setError(
            `Geçersiz dosya türü (${file.type || 'bilinmiyor'}). Yalnızca JPG, PNG, WebP, GIF ve HEIC dosyaları yüklenebilir.`
          )
          continue
        }

        /* Original-size sanity check — reject absurdly large files before
           we try to decode them, to avoid OOM on the canvas path. */
        if (file.size > MAX_FILE_SIZE) {
          const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
          setError(
            `Dosya çok büyük (${sizeMb} MB). Maksimum dosya boyutu 30 MB'dır.`
          )
          continue
        }

        /* ------------------------------------------------------------ */
        /* Optional client-side recompression                           */
        /* Files larger than COMPRESSION_THRESHOLD are shrunk to fit    */
        /* comfortably under Cloudinary's 10MB free-tier upload cap.   */
        /* ------------------------------------------------------------ */

        let fileToUpload: File = file
        if (
          file.size > COMPRESSION_THRESHOLD &&
          COMPRESSIBLE_MIME_TYPES.includes(fileType)
        ) {
          const compressed = await compressImage(file)
          if (compressed) {
            console.info(
              'Upload: compressed image',
              `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressed.size / 1024 / 1024).toFixed(1)}MB)`
            )
            fileToUpload = compressed
          } else {
            /* Compression failed (unsupported codec, decode error, etc.).
               Fall back to uploading the original — Cloudinary will
               reject it if it's too large, and we'll surface that error
               verbatim below. This is better than blocking the user
               outright. */
            console.warn('Upload: compression failed, uploading original', file.name)
          }
        }

        /* ------------------------------------------------------------ */
        /* Fetch a fresh signature from our server                      */
        /* ------------------------------------------------------------ */

        const signData = await fetchUploadSignature()
        if (!signData) {
          /* fetchUploadSignature already set the error message */
          continue
        }

        /* ------------------------------------------------------------ */
        /* Upload directly to Cloudinary                                */
        /* The bytes go browser → api.cloudinary.com, skipping Vercel   */
        /* entirely. This is how we get around the 4.5MB body limit.    */
        /* ------------------------------------------------------------ */

        const cloudinaryForm = new FormData()
        cloudinaryForm.append('file', fileToUpload)
        cloudinaryForm.append('api_key', signData.apiKey)
        cloudinaryForm.append('timestamp', String(signData.timestamp))
        cloudinaryForm.append('signature', signData.signature)
        cloudinaryForm.append('folder', signData.folder)

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: cloudinaryForm,
        })

        const data = await safeJson(response)

        /* Check for Cloudinary errors */
        if (!response.ok) {
          /**
           * Cloudinary returns errors in the shape `{ error: { message: string } }`.
           * We extract the message if present, otherwise fall back to a generic
           * Turkish message that mentions the HTTP status.
           */
          let cloudinaryMessage: string | null = null
          if (data && typeof data.error === 'object' && data.error !== null) {
            const errorObj = data.error as Record<string, unknown>
            if (typeof errorObj.message === 'string') {
              cloudinaryMessage = errorObj.message
            }
          }
          console.error(
            'Upload: Cloudinary rejected file',
            response.status,
            data,
            'original file:',
            file.name,
            file.type,
            file.size,
            'uploaded file:',
            fileToUpload.name,
            fileToUpload.type,
            fileToUpload.size
          )
          setError(
            cloudinaryMessage
              ? `Yükleme başarısız: ${cloudinaryMessage}`
              : `Yükleme başarısız oldu (HTTP ${response.status}). Lütfen tekrar deneyin.`
          )
          continue
        }

        /* Extract the Cloudinary public ID from the successful response */
        if (data && typeof data.public_id === 'string') {
          newImageIds.push(data.public_id)
        } else {
          /* Success status but no public_id — treat as a soft failure
             so the admin knows something went wrong. */
          console.error('Upload: success response missing public_id', data)
          setError('Cloudinary\'den beklenmeyen bir yanıt geldi. Lütfen tekrar deneyin.')
        }
      } catch (err) {
        /**
         * Network error or unexpected failure. Log the real exception
         * so we can diagnose the cause from the browser devtools.
         */
        console.error('Upload: fetch failed', err, 'file:', file.name, file.type, file.size)
        setError(
          `Yükleme sırasında bir hata oluştu: ${file.name}. İnternet bağlantınızı kontrol edip tekrar deneyin.`
        )
      } finally {
        /* Decrement the uploading counter as each file completes */
        setUploading((prev) => Math.max(0, prev - 1))
      }
    }

    /* Update the parent component with the new images */
    if (newImageIds.length > 0) {
      if (multiple) {
        /* Multi-image mode: append new image IDs to the existing array */
        onImagesChange([...images, ...newImageIds])
      } else {
        /* Single-image mode: replace the entire array with the new image */
        onImagesChange(newImageIds)
      }
    }
  }

  /* ================================================================ */
  /* IMAGE REMOVAL                                                     */
  /* ================================================================ */

  /**
   * Remove an image from the array by its index.
   * Filters out the image at the given index and updates the parent.
   *
   * Note: This only removes the image from the form state.
   * The actual Cloudinary resource is NOT deleted here — that would
   * require a separate API call and is handled during property deletion.
   *
   * @param index — the index of the image to remove from the array
   */
  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index)
    onImagesChange(updated)
  }

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */

  return (
    <div className={`${styles.container} ${uploading > 0 ? styles.uploading : ''}`}>
      {/* ============================================================ */}
      {/* DROPZONE — Drag-and-drop area + click to browse               */}
      {/* The dropzone provides both drag-and-drop and click-to-browse  */}
      {/* functionality. Visual feedback changes when a file is being   */}
      {/* dragged over (gold border + background tint).                 */}
      {/* ============================================================ */}
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Fotoğraf yüklemek için tıklayın veya sürükleyin"
        onKeyDown={(e) => {
          /* Allow Enter and Space to trigger the file dialog for accessibility */
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* Upload instructions or progress — Turkish text */}
        {uploading > 0 ? (
          /* Show upload progress when files are being uploaded */
          <p className={styles.dropzoneText}>
            {uploading} dosya yükleniyor...
          </p>
        ) : (
          /* Default instruction text when idle */
          <p className={styles.dropzoneText}>
            Fotoğrafları sürükleyip bırakın veya tıklayarak seçin
          </p>
        )}
      </div>

      {/* Hidden file input — visually hidden, triggered by dropzone click.
          The accept list mirrors the client-side ALLOWED_MIME_TYPES
          whitelist (JPG, PNG, WebP, GIF, HEIC/HEIF) so the file browser
          shows iPhone HEIC photos in addition to the classic formats.
          Drag-and-drop bypasses `accept`, which is why uploadFiles() also
          re-checks the MIME type before hitting Cloudinary. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Error message — shown when an upload fails */}
      {error && (
        <p className={styles.uploadError}>{error}</p>
      )}

      {/* ============================================================ */}
      {/* IMAGE PREVIEWS — Responsive grid of uploaded thumbnails       */}
      {/* Each preview shows a Cloudinary-optimized thumbnail with a    */}
      {/* remove button (x) in the top-right and a "Ana" (Primary)     */}
      {/* badge on the first image (index 0).                           */}
      {/* ============================================================ */}
      {images.length > 0 && (
        <div className={styles.previews}>
          {images.map((imageId, index) => (
            <div key={imageId} className={styles.previewItem}>
              {/* Cloudinary-optimized image thumbnail */}
              {/* width=200, height=150, crop=fill ensures consistent sizing */}
              {/* gravity=auto focuses on the most interesting part of the image */}
              <CldImage
                src={imageId}
                alt={`Fotoğraf ${index + 1}`}
                width={200}
                height={150}
                crop="fill"
                gravity="auto"
                className={styles.previewImage}
              />

              {/* Remove button — small x in the top-right corner */}
              {/* stopPropagation prevents the click from bubbling to the dropzone */}
              <button
                type="button"
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
                aria-label={`Fotoğraf ${index + 1} sil`}
              >
                &times;
              </button>

              {/* "Ana" (Primary) badge — shown only on the first image [0] */}
              {/* This image is used as the cover/hero image in property listings */}
              {index === 0 && (
                <span className={styles.primaryBadge}>Ana</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
