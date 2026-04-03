'use client';
/**
 * app/components/admin/PropertyForm.tsx — Create/Edit Property Form
 *
 * Client component that renders a comprehensive property form for
 * creating new listings or editing existing ones. All UI text is
 * in Turkish since the admin panel is Turkish-only.
 *
 * Two modes:
 * 1. CREATE MODE — when no 'property' prop is provided
 *    - All fields start empty / at default values
 *    - Submits via POST to /api/properties
 *    - No delete button shown
 *
 * 2. EDIT MODE — when 'property' prop is provided
 *    - Fields pre-filled with existing property data
 *    - Submits via PUT to /api/properties/[id]
 *    - Delete button shown with Turkish confirmation dialog
 *
 * Form sections:
 * - Basic info grid: title, price (EUR), location, bedrooms, bathrooms, area (m2)
 * - Description tabs: EN, TR, RU, AR (4 separate textareas for multilingual content)
 * - Image upload via ImageUpload component (drag-and-drop with Cloudinary)
 * - Toggle buttons: "Öne Çıkan" (featured), "Satılık"/"Kiralık" (sale/rent)
 *
 * Navigation:
 * - Uses useRouter from '@/i18n/navigation' for locale-aware routing
 * - On success: redirects to admin dashboard at /nmo-bbo-141522
 * - On error: shows Turkish error message inline
 *
 * Design system:
 * - Cormorant Garamond serif font throughout
 * - Gold (#C9A96E) accents, espresso (#2C1A0E) text
 * - 0.5px gold borders, no rounded corners (luxury aesthetic)
 */

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from '@/i18n/navigation'
import ImageUpload from './ImageUpload'
import styles from './PropertyForm.module.css'

/**
 * Property type — matches the serialized Prisma Property model.
 * This interface is only used when editing an existing property;
 * in create mode the property prop is omitted entirely.
 */
interface Property {
  id: number
  title: string
  /** English description — always required (primary language) */
  description: string
  /** Turkish description — optional translation */
  descriptionTr: string | null
  /** Russian description — optional translation */
  descriptionRu: string | null
  /** Arabic description — optional translation */
  descriptionAr: string | null
  /** Price in EUR */
  price: number
  /** Human-readable location string, e.g. "Antalya, Konyaalti" */
  location: string
  /** Number of bedrooms */
  bedrooms: number
  /** Number of bathrooms */
  bathrooms: number
  /** Area in square meters */
  area: number
  /** Array of Cloudinary public IDs for property photos */
  imageIds: string[]
  /** Cloudinary public ID for an optional video tour */
  videoId: string | null
  /** Whether this property appears on the homepage featured section */
  featured: boolean
  /** true = for sale ("Satirlik"), false = for rent ("Kiralik") */
  forSale: boolean
}

/**
 * PropertyForm props
 * - property: optional — if provided, the form operates in edit mode
 *   with fields pre-populated from the existing property data.
 *   If omitted, the form operates in create mode with empty fields.
 */
interface PropertyFormProps {
  property?: Property
}

/**
 * Description language tabs — defines the 4 supported languages
 * for multilingual property descriptions. Each tab switches
 * which textarea is visible, allowing the admin to enter
 * descriptions in English, Turkish, Russian, and Arabic.
 */
const DESCRIPTION_TABS = [
  { key: 'en', label: 'EN' },
  { key: 'tr', label: 'TR' },
  { key: 'ru', label: 'RU' },
  { key: 'ar', label: 'AR' },
] as const

/**
 * PropertyForm — the main create/edit property form component.
 *
 * Manages all form field states internally via useState hooks
 * and handles API submission (POST for create, PUT for edit,
 * DELETE for removal in edit mode).
 *
 * @param property — optional existing property data (edit mode)
 */
export default function PropertyForm({ property }: PropertyFormProps) {
  /* ================================================================ */
  /* MODE DETECTION                                                    */
  /* Determines whether we are creating a new property or editing one  */
  /* ================================================================ */
  const isEditMode = !!property

  /**
   * Locale-aware router from next-intl.
   * router.push('/nmo-bbo-141522') automatically prepends the
   * current locale (e.g., /tr/nmo-bbo-141522).
   */
  const router = useRouter()

  /* ================================================================ */
  /* FORM STATE                                                        */
  /* Each field is managed as a separate useState for fine-grained     */
  /* control. In edit mode, fields are pre-populated from the          */
  /* property prop; in create mode, they start empty or at defaults.   */
  /* ================================================================ */

  /** Property title — displayed as the listing headline */
  const [title, setTitle] = useState(property?.title || '')

  /** Price in EUR — stored as string for input binding, parsed on submit */
  const [price, setPrice] = useState(property?.price?.toString() || '')

  /** Location text — free-form, e.g. "Antalya, Konyaalti" */
  const [location, setLocation] = useState(property?.location || '')

  /** Number of bedrooms — string for input binding */
  const [bedrooms, setBedrooms] = useState(property?.bedrooms?.toString() || '0')

  /** Number of bathrooms — string for input binding */
  const [bathrooms, setBathrooms] = useState(property?.bathrooms?.toString() || '0')

  /** Area in square meters — string for input binding */
  const [area, setArea] = useState(property?.area?.toString() || '0')

  /**
   * Multilingual description fields.
   * EN (description) is the primary/required description.
   * TR, RU, AR are optional translations that fall back to EN
   * on the public site if not provided.
   */
  const [description, setDescription] = useState(property?.description || '')
  const [descriptionTr, setDescriptionTr] = useState(property?.descriptionTr || '')
  const [descriptionRu, setDescriptionRu] = useState(property?.descriptionRu || '')
  const [descriptionAr, setDescriptionAr] = useState(property?.descriptionAr || '')

  /** Currently active description language tab — defaults to English */
  const [activeDescTab, setActiveDescTab] = useState<string>('en')

  /**
   * Image IDs — array of Cloudinary public IDs.
   * The first image (index 0) is used as the primary/hero image
   * for the property listing.
   */
  const [imageIds, setImageIds] = useState<string[]>(property?.imageIds || [])

  /** Whether this property is featured on the homepage */
  const [featured, setFeatured] = useState(property?.featured || false)

  /**
   * Sale/rent toggle — true means "Satirlik" (for sale),
   * false means "Kiralik" (for rent).
   * Defaults to true (for sale) in create mode.
   */
  const [forSale, setForSale] = useState(property?.forSale !== false)

  /** Loading state — true during API submission, disables the form */
  const [isLoading, setIsLoading] = useState(false)

  /** Error message — displayed inline below the form when set */
  const [error, setError] = useState('')

  /* ================================================================ */
  /* DESCRIPTION TAB HELPERS                                           */
  /* These functions abstract reading/writing the correct description  */
  /* state variable based on which language tab is currently active.   */
  /* ================================================================ */

  /**
   * Returns the description value for the currently active language tab.
   * Maps the tab key ('en', 'tr', 'ru', 'ar') to the corresponding
   * state variable.
   */
  function getDescriptionValue(): string {
    switch (activeDescTab) {
      case 'en': return description
      case 'tr': return descriptionTr
      case 'ru': return descriptionRu
      case 'ar': return descriptionAr
      default: return description
    }
  }

  /**
   * Updates the description value for the currently active language tab.
   * Called by the textarea onChange handler.
   *
   * @param value — the new description text from the textarea
   */
  function setDescriptionValue(value: string) {
    switch (activeDescTab) {
      case 'en': setDescription(value); break
      case 'tr': setDescriptionTr(value); break
      case 'ru': setDescriptionRu(value); break
      case 'ar': setDescriptionAr(value); break
    }
  }

  /* ================================================================ */
  /* FORM SUBMISSION                                                   */
  /* Handles both create (POST) and update (PUT) operations.          */
  /* ================================================================ */

  /**
   * Handle form submission — creates a new property or updates
   * an existing one depending on the mode.
   *
   * Create mode: POST /api/properties
   * Edit mode:   PUT  /api/properties/[id]
   *
   * On success, navigates back to the admin dashboard.
   * On failure, displays a Turkish error message inline.
   *
   * @param e — the form submit event (prevented from default behavior)
   */
  async function handleSubmit(e: FormEvent) {
    /* Prevent the browser's default form submission */
    e.preventDefault()

    /* Clear any previous error messages */
    setError('')

    /* Activate loading state — disables all form inputs */
    setIsLoading(true)

    try {
      /**
       * Build the request body with all form field values.
       * Empty translation strings are sent as null so the API
       * can distinguish "not translated" from "empty string".
       */
      const body = {
        title,
        price,
        location,
        bedrooms,
        bathrooms,
        area,
        description,
        descriptionTr: descriptionTr || null,
        descriptionRu: descriptionRu || null,
        descriptionAr: descriptionAr || null,
        imageIds,
        featured,
        forSale,
      }

      /**
       * Determine the API endpoint and HTTP method based on mode.
       * Create mode uses POST to the collection endpoint.
       * Edit mode uses PUT to the specific resource endpoint.
       */
      const url = isEditMode
        ? `/api/properties/${property!.id}`
        : '/api/properties'

      const method = isEditMode ? 'PUT' : 'POST'

      /* Send the API request with JSON body */
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      /* If the API returned a non-OK status, extract and display the error */
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Bir hata oluştu')
        return
      }

      /**
       * Success — navigate back to the admin dashboard.
       * useRouter from '@/i18n/navigation' automatically prepends
       * the current locale prefix to the URL.
       */
      router.push('/nmo-bbo-141522')
    } catch {
      /* Network or unexpected error — show generic Turkish message */
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      /* Always reset loading state regardless of outcome */
      setIsLoading(false)
    }
  }

  /* ================================================================ */
  /* PROPERTY DELETION (Edit mode only)                                */
  /* ================================================================ */

  /**
   * Handle property deletion with Turkish confirmation dialog.
   * Only available in edit mode (the delete button is hidden in
   * create mode).
   *
   * Flow:
   * 1. Show browser confirm() with Turkish text
   * 2. If confirmed, send DELETE to /api/properties/[id]
   * 3. On success, redirect to admin dashboard
   * 4. On failure, display error inline
   */
  async function handleDelete() {
    /* Show confirmation dialog — "Are you sure you want to delete?" in Turkish */
    const confirmed = window.confirm('Silmek istediğinize emin misiniz?')
    if (!confirmed) return

    /* Activate loading state */
    setIsLoading(true)

    try {
      /* Send DELETE request to the property endpoint */
      const response = await fetch(`/api/properties/${property!.id}`, {
        method: 'DELETE',
      })

      /* Check for API errors */
      if (!response.ok) {
        setError('Silme işlemi başarısız oldu')
        return
      }

      /* Success — redirect to admin dashboard */
      router.push('/nmo-bbo-141522')
    } catch {
      /* Network error */
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* ============================================================ */}
      {/* FORM TITLE                                                    */}
      {/* Changes between "Yeni Emlak Ekle" (Add New Property) and      */}
      {/* "Emlak Duzenle" (Edit Property) based on the current mode.    */}
      {/* ============================================================ */}
      <h1 className={styles.formTitle}>
        {isEditMode ? 'Emlak Düzenle' : 'Yeni Emlak Ekle'}
      </h1>

      {/* ============================================================ */}
      {/* BASIC INFORMATION — Title field (full width)                  */}
      {/* ============================================================ */}
      <div className={styles.formGroup}>
        <label htmlFor="title" className={styles.label}>
          Başlık
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
          required
          disabled={isLoading}
          placeholder="Örn: Deniz Manzaralı Lüks Villa"
        />
      </div>

      {/* ============================================================ */}
      {/* 2-COLUMN GRID — Price, Location, Bedrooms, Bathrooms, Area   */}
      {/* On mobile this collapses to a single column via media query.  */}
      {/* ============================================================ */}
      <div className={styles.formGrid}>
        {/* Price field — value in Euros */}
        <div className={styles.formGroup}>
          <label htmlFor="price" className={styles.label}>
            Fiyat (€)
          </label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
            min="0"
            step="1"
            placeholder="0"
          />
        </div>

        {/* Location field — free-form text */}
        <div className={styles.formGroup}>
          <label htmlFor="location" className={styles.label}>
            Konum
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
            placeholder="Örn: Antalya, Konyaaltı"
          />
        </div>

        {/* Bedrooms count */}
        <div className={styles.formGroup}>
          <label htmlFor="bedrooms" className={styles.label}>
            Yatak Odası
          </label>
          <input
            id="bedrooms"
            type="number"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
          />
        </div>

        {/* Bathrooms count */}
        <div className={styles.formGroup}>
          <label htmlFor="bathrooms" className={styles.label}>
            Banyo
          </label>
          <input
            id="bathrooms"
            type="number"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
          />
        </div>

        {/* Area in square meters */}
        <div className={styles.formGroup}>
          <label htmlFor="area" className={styles.label}>
            Alan (m²)
          </label>
          <input
            id="area"
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* MULTILINGUAL DESCRIPTIONS                                     */}
      {/* Tab interface for EN, TR, RU, AR descriptions.                */}
      {/* Each tab shows a textarea for its language. The EN tab is     */}
      {/* the primary description; TR/RU/AR are optional translations.  */}
      {/* Arabic textarea uses dir="rtl" for right-to-left text.       */}
      {/* ============================================================ */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Açıklama</label>

        {/* Language tab buttons — highlights the active tab in gold */}
        <div className={styles.descriptionTabs}>
          {DESCRIPTION_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.descriptionTab} ${
                activeDescTab === tab.key ? styles.descriptionTabActive : ''
              }`}
              onClick={() => setActiveDescTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description textarea — content and placeholder change per tab */}
        <textarea
          value={getDescriptionValue()}
          onChange={(e) => setDescriptionValue(e.target.value)}
          className={styles.textarea}
          rows={6}
          disabled={isLoading}
          placeholder={
            activeDescTab === 'en'
              ? 'İngilizce açıklama (zorunlu)'
              : `${activeDescTab.toUpperCase()} açıklama (isteğe bağlı)`
          }
          /* Arabic text flows right-to-left */
          dir={activeDescTab === 'ar' ? 'rtl' : 'ltr'}
        />
      </div>

      {/* ============================================================ */}
      {/* IMAGE UPLOAD                                                  */}
      {/* Drag-and-drop image upload component with Cloudinary backend. */}
      {/* multiple=true allows uploading several property photos.       */}
      {/* The first image (index 0) is treated as the primary photo.   */}
      {/* ============================================================ */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Fotoğraflar</label>
        <ImageUpload
          images={imageIds}
          onImagesChange={setImageIds}
          multiple={true}
        />
      </div>

      {/* ============================================================ */}
      {/* TOGGLE BUTTONS                                                */}
      {/* Two toggle groups for boolean property flags.                 */}
      {/* ============================================================ */}
      <div className={styles.toggleGroup}>
        {/* Featured toggle — "Öne Çıkan" = Featured */}
        <span className={styles.label}>Öne Çıkan</span>
        <button
          type="button"
          className={`${styles.toggleButton} ${featured ? styles.toggleActive : ''}`}
          onClick={() => setFeatured(true)}
        >
          Evet
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${!featured ? styles.toggleActive : ''}`}
          onClick={() => setFeatured(false)}
        >
          Hayır
        </button>
      </div>

      <div className={styles.toggleGroup}>
        {/* Sale/Rent toggle — "Satılık" = For Sale, "Kiralık" = For Rent */}
        <span className={styles.label}>Tür</span>
        <button
          type="button"
          className={`${styles.toggleButton} ${forSale ? styles.toggleActive : ''}`}
          onClick={() => setForSale(true)}
        >
          Satılık
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${!forSale ? styles.toggleActive : ''}`}
          onClick={() => setForSale(false)}
        >
          Kiralık
        </button>
      </div>

      {/* ============================================================ */}
      {/* ERROR MESSAGE                                                 */}
      {/* Displayed inline when a submission error occurs.              */}
      {/* ============================================================ */}
      {error && (
        <p className={styles.error}>{error}</p>
      )}

      {/* ============================================================ */}
      {/* ACTION BUTTONS — Submit + Delete (edit mode only)             */}
      {/* The button row uses space-between to push the delete button   */}
      {/* to the opposite side from the submit button.                  */}
      {/* ============================================================ */}
      <div className={styles.buttonRow}>
        {/* Submit button — "Kaydet" (Save) in edit mode, "Oluştur" (Create) in create mode */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading
            ? 'Kaydediliyor...'
            : isEditMode
              ? 'Kaydet'
              : 'Oluştur'}
        </button>

        {/* Delete button — only rendered in edit mode */}
        {/* Triggers handleDelete which shows a Turkish confirmation dialog */}
        {isEditMode && (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={isLoading}
          >
            Sil
          </button>
        )}
      </div>
    </form>
  )
}
