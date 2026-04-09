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
  /** Minimum price in EUR (or the single price if no range) */
  price: number
  /** Optional upper bound — null means this listing has a single price */
  priceMax: number | null
  /** Human-readable location string, e.g. "Antalya, Konyaalti" */
  location: string
  /**
   * Turkish "X+Y" room convention (sahibinden.com style).
   * bedrooms    = X (number of bedrooms — the "Oda" count)
   * livingRooms = Y (number of salons — the "Salon" count)
   * Displayed as "{bedrooms}+{livingRooms}", e.g. "3+1"
   */
  bedrooms: number
  livingRooms: number
  /** Number of bathrooms */
  bathrooms: number
  /** Minimum brüt area in square meters (or the single area) */
  area: number
  /** Optional upper bound — null means this listing has a single area */
  areaMax: number | null
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

  /**
   * Price inputs — minimum (required) and optional maximum.
   * When `priceMax` is left empty, the listing shows a single price.
   * When both are set and priceMax > price, the card/detail page render
   * the range as "€X – €Y" (e.g. for new projects with a price range).
   */
  const [price, setPrice] = useState(property?.price?.toString() || '')
  const [priceMax, setPriceMax] = useState(
    property?.priceMax != null ? property.priceMax.toString() : ''
  )

  /** Location text — free-form, e.g. "Antalya, Konyaalti" */
  const [location, setLocation] = useState(property?.location || '')

  /**
   * Turkish "X+Y" room convention — Oda ("bedrooms", X) and Salon ("livingRooms", Y).
   * The preview below the two inputs renders them as "X+Y", e.g. "3+1".
   * Defaults:
   *   - bedrooms (Oda)     = '3' (most common Turkish apartment)
   *   - livingRooms (Salon) = '1' (nearly every unit has a single salon)
   */
  const [bedrooms, setBedrooms] = useState(property?.bedrooms?.toString() || '3')
  const [livingRooms, setLivingRooms] = useState(property?.livingRooms?.toString() || '1')

  /** Number of bathrooms — string for input binding */
  const [bathrooms, setBathrooms] = useState(property?.bathrooms?.toString() || '1')

  /**
   * Brüt area inputs — minimum (required) and optional maximum.
   * Used for project-style listings where one entry covers multiple
   * flats of different sizes (e.g. "120 – 180 m²" for an apartment
   * complex with several layouts). Leave `areaMax` empty for single
   * units to render a single-value label.
   */
  const [area, setArea] = useState(property?.area?.toString() || '0')
  const [areaMax, setAreaMax] = useState(
    property?.areaMax != null ? property.areaMax.toString() : ''
  )

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
        /* Optional upper bound — empty string → API stores null (single price) */
        priceMax: priceMax || null,
        location,
        /* Turkish "X+Y" convention (e.g. "3+1" = 3 bedrooms + 1 salon) */
        bedrooms,
        livingRooms,
        bathrooms,
        area,
        /* Optional upper bound — empty string → API stores null (single area) */
        areaMax: areaMax || null,
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
        {/* ========================================================
            Price (min) — the listing's lower bound. Required.
            For single-price listings this is the only number the
            admin enters; "Fiyat Max" stays blank.
            ======================================================== */}
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
            placeholder="Örn: 750000"
          />
        </div>

        {/* ========================================================
            Price (max) — OPTIONAL upper bound. Leave empty for a
            single-price listing. When set and greater than "Fiyat",
            the public card/detail page renders "€X – €Y".
            Useful for project launches where units within the same
            complex have different prices.
            ======================================================== */}
        <div className={styles.formGroup}>
          <label htmlFor="priceMax" className={styles.label}>
            Fiyat Max (€) <span className={styles.optional}>— isteğe bağlı</span>
          </label>
          <input
            id="priceMax"
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            step="1"
            placeholder="Tek fiyat için boş bırakın"
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

        {/* ========================================================
            Oda Sayısı (bedrooms) — the "X" in the Turkish X+Y format
            e.g. 3+1 means 3 bedrooms + 1 salon. Sahibinden.com style.
            ======================================================== */}
        <div className={styles.formGroup}>
          <label htmlFor="bedrooms" className={styles.label}>
            Oda Sayısı
          </label>
          <input
            id="bedrooms"
            type="number"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            placeholder="Örn: 3"
          />
        </div>

        {/* ========================================================
            Salon Sayısı (livingRooms) — the "Y" in X+Y.
            Usually 1 for apartments, 2 for duplexes / büyük daireler.
            ======================================================== */}
        <div className={styles.formGroup}>
          <label htmlFor="livingRooms" className={styles.label}>
            Salon Sayısı
          </label>
          <input
            id="livingRooms"
            type="number"
            value={livingRooms}
            onChange={(e) => setLivingRooms(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            placeholder="Örn: 1"
          />
        </div>

        {/* ========================================================
            X+Y preview — read-only label showing how the stat will
            be rendered on the public site. Updates live as the
            Oda/Salon inputs change.
            ======================================================== */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Oda + Salon</label>
          <div className={styles.roomPreview}>
            {(parseInt(bedrooms) || 0)}+{(parseInt(livingRooms) || 0)}
          </div>
        </div>

        {/* Bathrooms count — "Banyo Sayısı" (separate from rooms) */}
        <div className={styles.formGroup}>
          <label htmlFor="bathrooms" className={styles.label}>
            Banyo Sayısı
          </label>
          <input
            id="bathrooms"
            type="number"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            placeholder="Örn: 2"
          />
        </div>

        {/* ========================================================
            Area (min) — "Brüt Alan" (gross area in m²).
            For single-unit listings this is the only value entered;
            "Brüt Alan Max" stays blank.
            ======================================================== */}
        <div className={styles.formGroup}>
          <label htmlFor="area" className={styles.label}>
            Brüt Alan (m²)
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
            placeholder="Örn: 150"
          />
        </div>

        {/* ========================================================
            Area (max) — OPTIONAL upper bound. Leave empty for a
            single-size listing. When set and greater than "Brüt
            Alan", the public card/detail page renders "X – Y m²".
            Useful for complexes with mixed-size units.
            ======================================================== */}
        <div className={styles.formGroup}>
          <label htmlFor="areaMax" className={styles.label}>
            Brüt Alan Max (m²) <span className={styles.optional}>— isteğe bağlı</span>
          </label>
          <input
            id="areaMax"
            type="number"
            value={areaMax}
            onChange={(e) => setAreaMax(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            step="0.01"
            placeholder="Tek alan için boş bırakın"
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
