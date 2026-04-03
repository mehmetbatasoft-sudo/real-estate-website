'use client';
/**
 * ContactForm.tsx — Contact inquiry form for Ozgul's Realty
 *
 * A client-side form component that allows visitors to send inquiries
 * to the real estate agent.  Supports an optional propertyTitle prop
 * that pre-fills a hidden field so the agent knows which listing the
 * visitor is asking about.
 *
 * Features:
 *   - Fully translated via next-intl (namespace: 'contact')
 *   - Fields: name (required), email (required), phone (optional), message (required)
 *   - Hidden property field auto-filled when viewing a specific listing
 *   - Submits JSON to /api/contact via POST
 *   - Success / error feedback with automatic form reset on success
 *   - Luxury design system: Cormorant Garamond, espresso/gold/ivory palette,
 *     0.5px gold borders, no rounded corners
 *   - RTL support for Arabic locale
 *
 * Usage:
 *   <ContactForm />                              // general inquiry
 *   <ContactForm propertyTitle="Villa Azure" />   // property-specific inquiry
 */

'use client'

import React, { useState, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import styles from './ContactForm.module.css'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Props accepted by <ContactForm>. */
interface ContactFormProps {
  /**
   * Optional property title that pre-fills the hidden "property" field.
   * When provided the agent will see which listing prompted the inquiry.
   */
  propertyTitle?: string
}

/** Shape of the form data held in local state. */
interface FormData {
  /** Visitor's full name — required */
  name: string
  /** Visitor's email address — required */
  email: string
  /** Visitor's phone number — optional */
  phone: string
  /** Inquiry message body — required */
  message: string
  /** The property being inquired about — hidden, auto-filled from props */
  property: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * ContactForm
 *
 * Renders a styled contact form that posts visitor inquiries to the
 * /api/contact endpoint.  Displays success or error banners after
 * submission and resets the form on success.
 *
 * @param props - See {@link ContactFormProps}.
 * @returns A <form> element with labeled inputs and submit button.
 */
const ContactForm: React.FC<ContactFormProps> = ({ propertyTitle }) => {
  /* ---- i18n -------------------------------------------------------- */

  /** Translation function scoped to the 'contact' namespace */
  const t = useTranslations('contact')

  /* ---- State ------------------------------------------------------- */

  /**
   * formData — controlled state for every form field.
   * The property field defaults to propertyTitle when provided.
   */
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    property: propertyTitle ?? '',
  })

  /** Whether the form is currently submitting (disables the button). */
  const [loading, setLoading] = useState<boolean>(false)

  /** Whether the last submission succeeded (shows success banner). */
  const [success, setSuccess] = useState<boolean>(false)

  /** Error message string — empty string means no error. */
  const [error, setError] = useState<string>('')

  /* ---- Handlers ---------------------------------------------------- */

  /**
   * handleChange — generic change handler for all input / textarea fields.
   * Uses the element's `name` attribute to update the corresponding key
   * in formData so we don't need a separate handler per field.
   *
   * @param e - Change event from an <input> or <textarea>.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * handleSubmit — form submission handler.
   *
   * 1. Prevents the default browser form submission.
   * 2. Sets loading state to true (disables button, shows spinner text).
   * 3. POSTs JSON to /api/contact.
   * 4. On success: shows success banner, resets all fields.
   * 5. On error: shows error banner with translated message.
   * 6. Always resets the loading state when done.
   *
   * @param e - The form submission event.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    /* Reset previous feedback states */
    setLoading(true)
    setSuccess(false)
    setError('')

    try {
      /* POST the form data as JSON to the contact API route */
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      /* Check for non-2xx responses */
      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      /* Submission succeeded — show banner and clear the form */
      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        property: propertyTitle ?? '',
      })
    } catch {
      /* Submission failed — display the translated error message */
      setError(t('errorMessage'))
    } finally {
      /* Always re-enable the submit button */
      setLoading(false)
    }
  }

  /* ---- Render ------------------------------------------------------ */

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/*
       * Success banner — shown only after a successful submission.
       * Uses a gold left-border accent consistent with the luxury design system.
       */}
      {success && (
        <div className={styles.successMessage}>
          <strong>{t('success')}</strong>
          <p>{t('successMessage')}</p>
        </div>
      )}

      {/*
       * Error banner — shown only when the last submission failed.
       * Uses a red left-border accent to indicate a problem.
       */}
      {error && (
        <div className={styles.errorMessage}>
          <strong>{t('error')}</strong>
          <p>{error}</p>
        </div>
      )}

      {/*
       * Name and Email row — displayed side by side on desktop,
       * stacked on mobile via the .contactRow grid.
       */}
      <div className={styles.contactRow}>
        {/* Name field — required */}
        <div className={styles.formGroup}>
          <label htmlFor="contact-name" className={styles.label}>
            {t('name')}
          </label>
          <input
            id="contact-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        {/* Email field — required */}
        <div className={styles.formGroup}>
          <label htmlFor="contact-email" className={styles.label}>
            {t('email')}
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
      </div>

      {/* Phone field — optional, full width */}
      <div className={styles.formGroup}>
        <label htmlFor="contact-phone" className={styles.label}>
          {t('phone')}
        </label>
        <input
          id="contact-phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {/*
       * Hidden property field — not visible to the user.
       * Pre-filled with propertyTitle so the agent can identify
       * which listing the inquiry relates to.
       */}
      {propertyTitle && (
        <input
          type="hidden"
          name="property"
          value={formData.property}
        />
      )}

      {/* Message field — required, uses textarea for multi-line input */}
      <div className={styles.formGroup}>
        <label htmlFor="contact-message" className={styles.label}>
          {t('message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          className={styles.textarea}
        />
      </div>

      {/*
       * Submit button — shows "Sending..." while loading.
       * Disabled during submission to prevent duplicate requests.
       */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? t('sending') : t('send')}
      </button>
    </form>
  )
}

export default ContactForm
