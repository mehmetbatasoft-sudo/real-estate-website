'use client';
/**
 * PropertiesFilter.tsx — Property search and filter controls for Ozgul's Realty
 *
 * A client-side filter bar that lets visitors narrow down the property listings
 * by type (sale/rent), location, price range, bedroom count, and free-text
 * search.  All filter state is reflected in the URL via searchParams, enabling
 * shareable/bookmarkable filtered views and server-side data fetching based
 * on the query string.
 *
 * Features:
 *   - Fully translated via next-intl (namespace: 'properties')
 *   - 6 filter fields: type, location, minPrice, maxPrice, bedrooms, search
 *   - URL-driven state — reads initial values from searchParams, writes
 *     changes back via router.push so the page component can refetch
 *   - Supports both "Search" button click and Enter key press
 *   - "Reset" link clears all filters and navigates to the clean URL
 *   - Uses next-intl/navigation hooks (useRouter, usePathname) so locale
 *     prefixes are handled automatically
 *   - Luxury design system: Cormorant Garamond, gold/ivory palette,
 *     0.5px gold borders, no rounded corners
 *
 * Usage:
 *   <PropertiesFilter />
 *   // Reads ?type=sale&minPrice=100000 etc. from the URL
 */

'use client'

import React, { useState, useCallback, KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import styles from './PropertiesFilter.module.css'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Shape of the local filter state held in the component. */
interface FilterState {
  /** Property listing type — '' (all), 'sale', or 'rent' */
  type: string
  /** Location / area name free-text filter */
  location: string
  /** Minimum price (inclusive) — empty string means no minimum */
  minPrice: string
  /** Maximum price (inclusive) — empty string means no maximum */
  maxPrice: string
  /** Minimum number of bedrooms — empty string means no filter */
  bedrooms: string
  /** General keyword search across title and description */
  search: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * PropertiesFilter
 *
 * Renders a responsive filter bar with 6 fields in a 3-column grid.
 * Reads initial values from the current URL searchParams and pushes
 * updated params on submit.
 *
 * @returns A styled filter container with inputs and action buttons.
 */
const PropertiesFilter: React.FC = () => {
  /* ---- i18n & routing --------------------------------------------- */

  /** Translation function scoped to the 'properties' namespace */
  const t = useTranslations('properties')

  /** Locale-aware router — push() automatically includes the locale prefix */
  const router = useRouter()

  /** Current pathname without the locale prefix (e.g. '/properties') */
  const pathname = usePathname()

  /** Current URL search parameters (read-only) */
  const searchParams = useSearchParams()

  /* ---- Local state ------------------------------------------------ */

  /**
   * filters — local controlled state for all 6 filter fields.
   * Initialized from the URL searchParams so that navigating to a
   * filtered URL (e.g. via back button or shared link) pre-fills
   * the correct values.
   */
  const [filters, setFilters] = useState<FilterState>({
    type: searchParams.get('type') ?? '',
    location: searchParams.get('location') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    bedrooms: searchParams.get('bedrooms') ?? '',
    search: searchParams.get('search') ?? '',
  })

  /* ---- Handlers ---------------------------------------------------- */

  /**
   * handleChange — generic change handler for all filter inputs.
   * Uses the element's `name` attribute to update the matching key
   * in the filters state object.
   *
   * @param e - Change event from an <input> or <select>.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * applyFilters — builds a new URLSearchParams string from the current
   * local filter state and navigates to it.  Empty values are omitted
   * to keep the URL clean.
   *
   * Wrapped in useCallback so it can be safely passed to event handlers
   * and used inside handleKeyDown without causing stale closures.
   */
  const applyFilters = useCallback((): void => {
    /* Start with an empty params object */
    const params = new URLSearchParams()

    /* Only append non-empty filter values to the URL */
    if (filters.type) params.set('type', filters.type)
    if (filters.location) params.set('location', filters.location)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms)
    if (filters.search) params.set('search', filters.search)

    /* Build the final URL — append query string only if params exist */
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname

    /* Navigate to the filtered URL (locale prefix handled automatically) */
    router.push(url)
  }, [filters, pathname, router])

  /**
   * handleKeyDown — triggers filter application when the user presses
   * Enter inside any filter input, providing a keyboard-friendly UX.
   *
   * @param e - Keyboard event from an input or select element.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applyFilters()
    }
  }

  /**
   * handleReset — clears all local filter state and navigates to the
   * base pathname with no query parameters.
   */
  const handleReset = (): void => {
    /* Reset every filter field to its empty default */
    setFilters({
      type: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      search: '',
    })

    /* Navigate to the clean URL (no searchParams) */
    router.push(pathname)
  }

  /* ---- Render ------------------------------------------------------ */

  return (
    <div className={styles.filterContainer}>
      {/*
       * Filter grid — 3 columns on desktop, 1 column on mobile.
       * Each .filterGroup contains a label and its input/select.
       */}
      <div className={styles.filterGrid}>
        {/* Type filter — select dropdown: All / For Sale / For Rent */}
        <div className={styles.filterGroup}>
          <label htmlFor="filter-type" className={styles.filterLabel}>
            {t('filterTitle')}
          </label>
          <select
            id="filter-type"
            name="type"
            value={filters.type}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={styles.filterSelect}
          >
            {/* "All" shows every listing regardless of sale/rent status */}
            <option value="">{t('all')}</option>
            {/* "For Sale" maps to forSale=true in the database */}
            <option value="sale">{t('forSale')}</option>
            {/* "For Rent" maps to forSale=false in the database */}
            <option value="rent">{t('forRent')}</option>
          </select>
        </div>

        {/* Location filter — free-text input for area / neighbourhood */}
        <div className={styles.filterGroup}>
          <label htmlFor="filter-location" className={styles.filterLabel}>
            {t('location')}
          </label>
          <input
            id="filter-location"
            type="text"
            name="location"
            value={filters.location}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={styles.filterInput}
          />
        </div>

        {/* Minimum price filter — number input */}
        <div className={styles.filterGroup}>
          <label htmlFor="filter-minPrice" className={styles.filterLabel}>
            {t('price')} (min)
          </label>
          <input
            id="filter-minPrice"
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            min="0"
            className={styles.filterInput}
          />
        </div>

        {/* Maximum price filter — number input */}
        <div className={styles.filterGroup}>
          <label htmlFor="filter-maxPrice" className={styles.filterLabel}>
            {t('price')} (max)
          </label>
          <input
            id="filter-maxPrice"
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            min="0"
            className={styles.filterInput}
          />
        </div>

        {/* Rooms filter — number input for minimum room count
            (Turkish "oda sayısı" — the X in the X+Y convention).
            The URL param is still `bedrooms` for backwards compatibility
            with any existing bookmarks/shared links. */}
        <div className={styles.filterGroup}>
          <label htmlFor="filter-bedrooms" className={styles.filterLabel}>
            {t('rooms')}
          </label>
          <input
            id="filter-bedrooms"
            type="number"
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            min="0"
            className={styles.filterInput}
          />
        </div>

        {/* General search — free-text keyword search across listings */}
        <div className={styles.filterGroup}>
          <label htmlFor="filter-search" className={styles.filterLabel}>
            {t('search')}
          </label>
          <input
            id="filter-search"
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={styles.filterInput}
          />
        </div>
      </div>

      {/*
       * Action buttons — "Search" applies filters, "Reset" clears them.
       * Positioned below the filter grid with top margin.
       */}
      <div className={styles.filterActions}>
        {/* Search button — applies the current filter state to the URL */}
        <button
          type="button"
          onClick={applyFilters}
          className={styles.searchButton}
        >
          {t('search')}
        </button>

        {/* Reset button — clears all filters and navigates to clean URL */}
        <button
          type="button"
          onClick={handleReset}
          className={styles.resetButton}
        >
          {t('resetFilters')}
        </button>
      </div>
    </div>
  )
}

export default PropertiesFilter
