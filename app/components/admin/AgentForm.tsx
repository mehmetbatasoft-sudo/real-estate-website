'use client';
/**
 * app/components/admin/AgentForm.tsx — Agent Profile Edit Form
 *
 * Client component that renders the agent profile editing form.
 * All UI text is in Turkish since the admin panel is Turkish-only.
 *
 * ALWAYS EDIT MODE — there is no "create agent" flow.
 * The single agent record is created during database seeding.
 * This form only updates the existing agent profile.
 *
 * Form sections:
 * - Personal info: "Ad Soyad" (name), "Ünvan" (title)
 * - Contact: "Telefon" (phone), "E-posta" (email)
 * - Stats: "Deneyim (Yıl)" (experience), "Aktif İlanlar" (listings),
 *   "Puan" (rating)
 * - Bio tabs: EN, TR, RU, AR (4 separate textareas for multilingual bios)
 * - Single photo upload via ImageUpload component (multiple=false)
 *
 * Navigation:
 * - Uses useRouter from '@/i18n/navigation' for locale-aware routing
 * - On success: redirects to admin dashboard at /nmo-bbo-141522
 * - On error: shows Turkish error message inline
 *
 * API:
 * - Submit: PUT /api/agent/[id] to update the agent record
 * - No delete functionality (single-agent architecture, always 1 agent)
 *
 * Styling:
 * - Reuses PropertyForm.module.css for consistent admin form styling
 * - Same input, label, button, and layout classes as PropertyForm
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
 * Agent type — matches the serialized Prisma Agent model.
 * Required prop since AgentForm is always in edit mode and
 * receives the existing agent data from the parent server component.
 */
interface Agent {
  /** Unique database identifier */
  id: number
  /** Full name — "Ad Soyad" in Turkish */
  name: string
  /** Professional title — "Ünvan" in Turkish, e.g. "Kıdemli Emlak Danışmanı" */
  title: string
  /** English bio — primary/required biography text */
  bio: string
  /** Turkish bio — optional translation */
  bioTr: string | null
  /** Russian bio — optional translation */
  bioRu: string | null
  /** Arabic bio — optional translation */
  bioAr: string | null
  /** Phone number — "Telefon" in Turkish */
  phone: string
  /** Email address — "E-posta" in Turkish */
  email: string
  /** Cloudinary public ID for the agent portrait photo */
  imageId: string
  /** Years of experience — "Deneyim (Yıl)" in Turkish */
  experience: number
  /** Number of active listings — "Aktif İlanlar" in Turkish */
  listings: number
  /** Agent rating out of 5 — "Puan" in Turkish */
  rating: number
}

/**
 * AgentForm props
 * - agent: required — always in edit mode, no create mode.
 *   This agent data is fetched by the parent server component and passed down.
 *
 * Note: locale is NOT needed as a prop because useRouter from
 * '@/i18n/navigation' automatically prepends the current locale.
 */
interface AgentFormProps {
  agent: Agent
}

/**
 * Bio language tabs — defines the 4 supported languages for multilingual
 * agent biographies. Each tab switches which textarea is visible,
 * allowing the admin to write bios in English, Turkish, Russian, and Arabic.
 */
const BIO_TABS = [
  { key: 'en', label: 'EN' },
  { key: 'tr', label: 'TR' },
  { key: 'ru', label: 'RU' },
  { key: 'ar', label: 'AR' },
] as const

/**
 * AgentForm — the agent profile editing form component.
 *
 * Manages all form field states internally via useState hooks
 * and handles API submission via PUT to /api/agent/[id].
 * Reuses PropertyForm.module.css for consistent admin UI styling.
 *
 * @param agent — the existing agent data to pre-populate the form
 */
export default function AgentForm({ agent }: AgentFormProps) {
  /**
   * Locale-aware router from next-intl.
   * router.push('/nmo-bbo-141522') automatically prepends the
   * current locale (e.g., /tr/nmo-bbo-141522).
   */
  const router = useRouter()

  /* ================================================================ */
  /* FORM STATE                                                        */
  /* Each field is managed as a separate useState hook, pre-populated   */
  /* from the existing agent data passed via props.                     */
  /* ================================================================ */

  /** Agent full name — "Ad Soyad" label in the UI */
  const [name, setName] = useState(agent.name)

  /** Professional title — "Ünvan" label, e.g. "Kıdemli Gayrimenkul Danışmanı" */
  const [title, setTitle] = useState(agent.title)

  /** Phone number — "Telefon" label */
  const [phone, setPhone] = useState(agent.phone)

  /** Email address — "E-posta" label */
  const [email, setEmail] = useState(agent.email)

  /** Years of experience — "Deneyim (Yıl)" label, stored as string for input */
  const [experience, setExperience] = useState(agent.experience.toString())

  /** Active listings count — "Aktif İlanlar" label, stored as string for input */
  const [listings, setListings] = useState(agent.listings.toString())

  /** Rating out of 5 — "Puan" label, stored as string for input */
  const [rating, setRating] = useState(agent.rating.toString())

  /**
   * Multilingual biography fields.
   * EN (bio) is the primary/required biography.
   * TR, RU, AR are optional translations that fall back to EN
   * on the public site if not provided.
   */
  const [bio, setBio] = useState(agent.bio)
  const [bioTr, setBioTr] = useState(agent.bioTr || '')
  const [bioRu, setBioRu] = useState(agent.bioRu || '')
  const [bioAr, setBioAr] = useState(agent.bioAr || '')

  /** Currently active bio language tab — defaults to English */
  const [activeBioTab, setActiveBioTab] = useState<string>('en')

  /**
   * Agent portrait image — stored as a single-element array for
   * compatibility with the ImageUpload component interface.
   * ImageUpload expects string[] for images, and we extract the
   * first element when submitting to the API.
   */
  const [images, setImages] = useState<string[]>(
    agent.imageId ? [agent.imageId] : []
  )

  /** Loading state — true during API submission, disables all form inputs */
  const [isLoading, setIsLoading] = useState(false)

  /** Error message — displayed inline below the form when set */
  const [error, setError] = useState('')

  /* ================================================================ */
  /* BIO TAB HELPERS                                                   */
  /* These functions abstract reading/writing the correct bio state    */
  /* variable based on which language tab is currently active.          */
  /* ================================================================ */

  /**
   * Returns the bio value for the currently active language tab.
   * Maps the tab key ('en', 'tr', 'ru', 'ar') to the corresponding
   * state variable.
   */
  function getBioValue(): string {
    switch (activeBioTab) {
      case 'en': return bio
      case 'tr': return bioTr
      case 'ru': return bioRu
      case 'ar': return bioAr
      default: return bio
    }
  }

  /**
   * Updates the bio value for the currently active language tab.
   * Called by the textarea onChange handler.
   *
   * @param value — the new bio text from the textarea
   */
  function setBioValue(value: string) {
    switch (activeBioTab) {
      case 'en': setBio(value); break
      case 'tr': setBioTr(value); break
      case 'ru': setBioRu(value); break
      case 'ar': setBioAr(value); break
    }
  }

  /* ================================================================ */
  /* FORM SUBMISSION                                                   */
  /* Always PUT since this is always edit mode (single-agent model).   */
  /* ================================================================ */

  /**
   * Handle form submission — updates the agent profile via PUT.
   *
   * Sends PUT /api/agent/[id] with all form field values.
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
       * Empty bio translation strings are sent as null so the API
       * can distinguish "not translated" from "empty string".
       * imageId is extracted from the array (first element only,
       * since agents have a single portrait photo).
       */
      const body = {
        name,
        title,
        phone,
        email,
        experience,
        listings,
        rating,
        bio,
        bioTr: bioTr || null,
        bioRu: bioRu || null,
        bioAr: bioAr || null,
        imageId: images[0] || '',
      }

      /* Send PUT request to the agent API endpoint */
      const response = await fetch(`/api/agent/${agent.id}`, {
        method: 'PUT',
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
  /* RENDER                                                            */
  /* Reuses PropertyForm.module.css styles for consistent admin UI.    */
  /* ================================================================ */

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* ============================================================ */}
      {/* FORM TITLE                                                    */}
      {/* Always "Temsilci Profili Düzenle" (Edit Agent Profile)        */}
      {/* since there is no create mode for agents.                     */}
      {/* ============================================================ */}
      <h1 className={styles.formTitle}>Temsilci Profili Düzenle</h1>

      {/* ============================================================ */}
      {/* PERSONAL INFORMATION — Name and Title (full width)            */}
      {/* These fields span the full form width as they may contain     */}
      {/* longer text that benefits from more horizontal space.         */}
      {/* ============================================================ */}

      {/* Agent full name — "Ad Soyad" (First Name Last Name) */}
      <div className={styles.formGroup}>
        <label htmlFor="agent-name" className={styles.label}>
          Ad Soyad
        </label>
        <input
          id="agent-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          required
          disabled={isLoading}
          placeholder="Örn: Ahmet Yılmaz"
        />
      </div>

      {/* Professional title — "Ünvan" (Title) */}
      <div className={styles.formGroup}>
        <label htmlFor="agent-title" className={styles.label}>
          Ünvan
        </label>
        <input
          id="agent-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
          required
          disabled={isLoading}
          placeholder="Örn: Kıdemli Gayrimenkul Danışmanı"
        />
      </div>

      {/* ============================================================ */}
      {/* 2-COLUMN GRID — Contact info and professional stats           */}
      {/* Phone, Email, Experience, Listings, Rating arranged in a      */}
      {/* compact grid. Collapses to 1 column on mobile via CSS.        */}
      {/* ============================================================ */}
      <div className={styles.formGrid}>
        {/* Phone number — "Telefon" */}
        <div className={styles.formGroup}>
          <label htmlFor="agent-phone" className={styles.label}>
            Telefon
          </label>
          <input
            id="agent-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
            placeholder="Örn: +90 532 123 4567"
          />
        </div>

        {/* Email address — "E-posta" */}
        <div className={styles.formGroup}>
          <label htmlFor="agent-email" className={styles.label}>
            E-posta
          </label>
          <input
            id="agent-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
            placeholder="Örn: ahmet@ozgulsrealty.com"
          />
        </div>

        {/* Years of experience — "Deneyim (Yıl)" */}
        <div className={styles.formGroup}>
          <label htmlFor="agent-experience" className={styles.label}>
            Deneyim (Yıl)
          </label>
          <input
            id="agent-experience"
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
          />
        </div>

        {/* Active listings count — "Aktif İlanlar" */}
        <div className={styles.formGroup}>
          <label htmlFor="agent-listings" className={styles.label}>
            Aktif İlanlar
          </label>
          <input
            id="agent-listings"
            type="number"
            value={listings}
            onChange={(e) => setListings(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
          />
        </div>

        {/* Rating out of 5 — "Puan" */}
        <div className={styles.formGroup}>
          <label htmlFor="agent-rating" className={styles.label}>
            Puan
          </label>
          <input
            id="agent-rating"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            min="0"
            max="5"
            step="0.1"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* MULTILINGUAL BIOS                                             */}
      {/* Tab interface for EN, TR, RU, AR biographies.                 */}
      {/* Each tab shows a textarea for its language. The EN tab is     */}
      {/* the primary bio; TR/RU/AR are optional translations.          */}
      {/* Arabic textarea uses dir="rtl" for right-to-left text.       */}
      {/* ============================================================ */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Biyografi</label>

        {/* Language tab buttons — highlights the active tab in gold */}
        <div className={styles.descriptionTabs}>
          {BIO_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.descriptionTab} ${
                activeBioTab === tab.key ? styles.descriptionTabActive : ''
              }`}
              onClick={() => setActiveBioTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bio textarea — content and placeholder change per active tab */}
        <textarea
          value={getBioValue()}
          onChange={(e) => setBioValue(e.target.value)}
          className={styles.textarea}
          rows={6}
          disabled={isLoading}
          placeholder={
            activeBioTab === 'en'
              ? 'İngilizce biyografi (zorunlu)'
              : `${activeBioTab.toUpperCase()} biyografi (isteğe bağlı)`
          }
          /* Arabic text flows right-to-left */
          dir={activeBioTab === 'ar' ? 'rtl' : 'ltr'}
        />
      </div>

      {/* ============================================================ */}
      {/* AGENT PHOTO                                                   */}
      {/* Single portrait photo upload via ImageUpload component.       */}
      {/* multiple=false restricts to exactly 1 image — uploading a     */}
      {/* new photo replaces the current one.                           */}
      {/* ============================================================ */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Fotoğraf</label>
        {/* multiple=false — agent has a single portrait photo, not an array */}
        <ImageUpload
          images={images}
          onImagesChange={setImages}
          multiple={false}
        />
      </div>

      {/* ============================================================ */}
      {/* ERROR MESSAGE                                                 */}
      {/* Displayed inline when a submission error occurs.              */}
      {/* ============================================================ */}
      {error && (
        <p className={styles.error}>{error}</p>
      )}

      {/* ============================================================ */}
      {/* SUBMIT BUTTON                                                 */}
      {/* No delete button — agent record cannot be deleted.            */}
      {/* Single "Kaydet" (Save) button in the button row.              */}
      {/* ============================================================ */}
      <div className={styles.buttonRow}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
