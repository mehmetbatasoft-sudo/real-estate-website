'use client';
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
 * - Multi-file upload to /api/upload endpoint via FormData
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
 * Upload flow:
 * 1. User drops files onto the dropzone or clicks to open the file browser
 * 2. Each file is uploaded individually via FormData to POST /api/upload
 * 3. The API validates the file (type, size) and uploads to Cloudinary
 * 4. API returns { publicId, secureUrl } for each successful upload
 * 5. publicId is appended to the images array (or replaces it in single mode)
 * 6. Parent component receives the updated array via onImagesChange callback
 *
 * Supported formats (mirrors app/api/upload/route.ts):
 *   JPG / JPEG / PNG / WebP / GIF / HEIC / HEIF
 *   HEIC is included because iPhones shoot in it by default — Cloudinary
 *   auto-transcodes on ingest so public pages get JPG.
 *
 * Error handling:
 *   - Server returns Turkish JSON errors, shown verbatim
 *   - Non-JSON responses fall back to a generic Turkish message that
 *     still exposes the HTTP status for debuggability
 *   - Network failures log the real exception via console.error so the
 *     admin (or a developer) can diagnose the cause from devtools
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

'use client'

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
  /* Handles uploading files to /api/upload via FormData.              */
  /* Each file is uploaded individually (sequential, not parallel)     */
  /* to avoid overwhelming the server.                                 */
  /* ================================================================ */

  /**
   * Safely parse a fetch Response as JSON.
   *
   * Route Handlers are supposed to always return JSON, but a broken dev
   * server, a proxy error page, or a dropped connection can leave us
   * holding an HTML / empty body. `response.json()` throws on those,
   * which used to bubble up to the outer catch and show the user a
   * useless "Yükleme sırasında bir hata oluştu" with no hint of the
   * real cause. Falling back to `text()` + manual parse lets us return
   * a typed null on failure so callers can decide how to handle it.
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
   * Upload files to the server via /api/upload.
   *
   * For each file:
   * 1. Creates a FormData with the 'file' field
   * 2. Sends POST to /api/upload
   * 3. Collects the returned publicId on success
   * 4. Updates the parent's images array via onImagesChange
   *
   * In single-image mode (multiple=false), only the first file is
   * uploaded and it replaces any existing image.
   *
   * Error handling strategy:
   *   - The server always returns JSON with an `error` field on failure,
   *     so we surface `data.error` directly (already translated to Turkish
   *     by the API route).
   *   - If the response body is NOT valid JSON (network glitch, dev server
   *     crash, proxy error page), we fall back to a generic Turkish message
   *     that mentions the HTTP status so the admin has something concrete
   *     to report.
   *   - Network exceptions (offline, DNS failure, aborted fetch) are caught
   *     and logged to the browser console, and we show a friendly Turkish
   *     message prompting the user to retry.
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
        /* Create FormData with the file under the 'file' field name */
        const formData = new FormData()
        formData.append('file', file)

        /* Send POST request to the upload API endpoint */
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        /* Parse the response body once — safeJson never throws */
        const data = await safeJson(response)

        /* Check for API errors (invalid type, too large, auth failure, etc.) */
        if (!response.ok) {
          /* Prefer the translated error from the API; fall back to a
             generic Turkish message that still mentions the HTTP status
             so unexpected failures are traceable. */
          const apiError =
            data && typeof data.error === 'string' ? data.error : null
          setError(
            apiError ||
              `Yükleme başarısız oldu (HTTP ${response.status}). Lütfen tekrar deneyin.`
          )
          continue /* Skip this file but continue with others */
        }

        /* Extract the Cloudinary public ID from the successful response */
        if (data && typeof data.publicId === 'string') {
          newImageIds.push(data.publicId)
        } else {
          /* Success status but no publicId — treat as a soft failure
             so the admin knows something went wrong. */
          console.error('Upload: success response missing publicId', data)
          setError('Sunucudan beklenmeyen bir yanıt geldi. Lütfen tekrar deneyin.')
        }
      } catch (err) {
        /**
         * Network error or unexpected failure. Log the real exception
         * so we can diagnose the cause from the browser devtools —
         * previously this block swallowed the error and left us blind.
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
          The accept list mirrors the server-side whitelist in
          app/api/upload/route.ts (JPG, PNG, WebP, GIF, HEIC/HEIF) so the
          file browser shows iPhone HEIC photos in addition to the classic
          formats. Drag-and-drop bypasses `accept`, so the server still
          does its own validation regardless. */}
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
