'use client';
/**
 * app/components/admin/AdminDashboard.tsx — Main Admin Dashboard Component
 *
 * Client component that renders the full admin panel UI.
 * All text is in Turkish since the admin panel is Turkish-only.
 *
 * Architecture:
 * - Receives all data (properties, inquiries, agents) as props from
 *   the parent server component (app/[locale]/nmo-bbo-141522/page.tsx)
 * - No client-side data fetching for initial load (server component handles it)
 * - Client-side state manages: active tab, pagination, and inquiry read status
 *
 * 4 Tabs:
 * 1. "Genel Bakis" (Overview) — stats cards + last 5 inquiries
 * 2. "Emlaklar" (Properties) — paginated table with edit links
 * 3. "Talepler" (Inquiries) — paginated list with read/unread toggle
 * 4. "Temsilci Profili" (Agent Profile) — agent info + edit link
 *
 * Pagination:
 * - SEPARATE state for properties and inquiries (10 items per page each)
 * - Both reset to page 1 when switching tabs
 *
 * Sign Out:
 * - Uses signOut from next-auth/react
 * - Redirects to login page after signing out
 */

import { useState, useMemo } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './AdminDashboard.module.css'

/**
 * Property type — matches the Prisma Property model
 * All properties have these fields from the database
 */
interface Property {
  id: number
  title: string
  description: string
  descriptionTr: string | null
  descriptionRu: string | null
  descriptionAr: string | null
  price: number
  location: string
  /* Turkish "X+Y" room convention — bedrooms is X, livingRooms is Y */
  bedrooms: number
  livingRooms: number
  bathrooms: number
  area: number
  imageIds: string[]
  videoId: string | null
  featured: boolean
  forSale: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Inquiry type — matches the Prisma Inquiry model
 * Represents a contact form submission from a visitor
 */
interface Inquiry {
  id: number
  name: string
  email: string
  phone: string | null
  message: string
  property: string | null
  createdAt: string
  read: boolean
}

/**
 * Agent type — matches the serialized Prisma Agent model.
 * Single-agent architecture — always exactly 1 record.
 *
 * Note: experience and rating still exist on the DB table but are no longer
 * surfaced by the admin panel or the public about page, so they are
 * intentionally omitted from this local interface.
 */
interface Agent {
  id: number
  name: string
  title: string
  bio: string
  bioTr: string | null
  bioRu: string | null
  bioAr: string | null
  phone: string
  email: string
  imageId: string
  listings: number
}

/**
 * AdminDashboard props — all data fetched by the parent server component
 * locale is needed for constructing navigation URLs
 */
interface AdminDashboardProps {
  properties: Property[]
  inquiries: Inquiry[]
  agents: Agent[]
  locale: string
}

/**
 * Tab configuration — Turkish labels for the 4 dashboard tabs
 * Each tab has a unique key and a Turkish display label
 */
const TABS = [
  { key: 'overview', label: 'Genel Bakış' },
  { key: 'properties', label: 'Emlaklar' },
  { key: 'inquiries', label: 'Talepler' },
  { key: 'agent', label: 'Temsilci Profili' },
] as const

/** Number of items per page in paginated tables/lists */
const ITEMS_PER_PAGE = 10

/**
 * AdminDashboard — the main admin panel UI component
 * Renders header, tabs, and tab content based on active tab
 */
export default function AdminDashboard({
  properties,
  inquiries: initialInquiries,
  agents,
  locale,
}: AdminDashboardProps) {
  /* Active tab state — defaults to "overview" */
  const [activeTab, setActiveTab] = useState<string>('overview')

  /* SEPARATE pagination state for properties and inquiries */
  const [propertyPage, setPropertyPage] = useState(1)
  const [inquiryPage, setInquiryPage] = useState(1)

  /* Inquiry state — mutable copy so we can toggle read/unread status */
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries)

  /* Router for programmatic navigation */
  const router = useRouter()

  /**
   * Calculate overview statistics using useMemo for performance
   * These values only change when the properties or inquiries data changes
   */
  const stats = useMemo(() => ({
    /* Total number of properties in the system */
    totalProperties: properties.length,
    /* Total number of inquiries received */
    totalInquiries: inquiries.length,
    /* Number of properties marked as "featured" (shown on homepage) */
    featuredCount: properties.filter((p) => p.featured).length,
    /* Number of unread inquiries (new submissions not yet reviewed) */
    unreadInquiries: inquiries.filter((i) => !i.read).length,
  }), [properties, inquiries])

  /**
   * Paginated properties — slice the full array for the current page
   * startIndex: first item index for current page
   * endIndex: last item index (exclusive) for current page
   */
  const paginatedProperties = useMemo(() => {
    const startIndex = (propertyPage - 1) * ITEMS_PER_PAGE
    return properties.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [properties, propertyPage])

  /** Total number of property pages */
  const totalPropertyPages = Math.ceil(properties.length / ITEMS_PER_PAGE)

  /**
   * Paginated inquiries — slice the full array for the current page
   */
  const paginatedInquiries = useMemo(() => {
    const startIndex = (inquiryPage - 1) * ITEMS_PER_PAGE
    return inquiries.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [inquiries, inquiryPage])

  /** Total number of inquiry pages */
  const totalInquiryPages = Math.ceil(inquiries.length / ITEMS_PER_PAGE)

  /**
   * Handle tab change — sets the active tab and resets BOTH paginations
   * This ensures users always start at page 1 when switching tabs
   */
  function handleTabChange(tabKey: string) {
    setActiveTab(tabKey)
    /* Reset both paginations when switching tabs */
    setPropertyPage(1)
    setInquiryPage(1)
  }

  /**
   * Toggle inquiry read/unread status
   * Sends a PATCH request to the API and updates local state optimistically
   *
   * @param inquiryId - The ID of the inquiry to toggle
   * @param currentReadStatus - The current read status (true/false)
   */
  async function toggleInquiryRead(inquiryId: number, currentReadStatus: boolean) {
    /* Optimistic update — update local state immediately for responsive UI */
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, read: !currentReadStatus } : inq
      )
    )

    try {
      /* Send PATCH request to update read status in the database */
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inquiryId,
          read: !currentReadStatus,
        }),
      })

      /* If the API call fails, revert the optimistic update */
      if (!response.ok) {
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryId ? { ...inq, read: currentReadStatus } : inq
          )
        )
      }
    } catch {
      /* On network error, revert the optimistic update */
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, read: currentReadStatus } : inq
        )
      )
    }
  }

  /**
   * Handle sign out — calls next-auth signOut and redirects to login
   * callbackUrl sends the admin to the login page after session is destroyed
   */
  function handleSignOut() {
    signOut({ callbackUrl: `/${locale}/nmo-bbo-141522/login` })
  }

  /**
   * Format price for display — adds euro sign and thousand separators
   * e.g., 1500000 -> "€1,500,000"
   */
  function formatPrice(price: number): string {
    return `€${price.toLocaleString()}`
  }

  /**
   * Format date for display — converts ISO string to localized Turkish date
   * e.g., "2024-01-15T10:30:00Z" -> "15.01.2024"
   */
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  /**
   * Generate page numbers array for pagination buttons
   * Creates an array like [1, 2, 3, 4, 5] for totalPages = 5
   */
  function getPageNumbers(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  /* Get the first agent for the agent profile tab (single-agent architecture) */
  const agent = agents.length > 0 ? agents[0] : null

  return (
    <div className={styles.dashboard}>
      {/* ================================================================ */}
      {/* HEADER — Dashboard title + action buttons                        */}
      {/* ================================================================ */}
      <header className={styles.header}>
        {/* Dashboard title — Turkish */}
        <h1 className={styles.title}>Admin Panel</h1>

        {/* Header actions — Add Property + Sign Out buttons */}
        <div className={styles.headerActions}>
          {/* "Emlak Ekle" = Add Property — links to the new property form */}
          <button
            className={styles.addButton}
            onClick={() => router.push(`/${locale}/nmo-bbo-141522/properties/new`)}
          >
            Emlak Ekle
          </button>

          {/* "Cikis Yap" = Sign Out — destroys the session */}
          <button
            className={styles.signOutButton}
            onClick={handleSignOut}
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      {/* ================================================================ */}
      {/* TABS — Navigation between dashboard sections                     */}
      {/* ================================================================ */}
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ================================================================ */}
      {/* TAB CONTENT — Renders based on activeTab state                   */}
      {/* ================================================================ */}
      <div className={styles.content}>
        {/* ============================================================ */}
        {/* TAB 1: GENEL BAKIS (Overview)                                */}
        {/* Stats cards + last 5 inquiries                               */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid — 3 cards showing key metrics */}
            <div className={styles.statsGrid}>
              {/* Total properties stat card */}
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.totalProperties}</div>
                <div className={styles.statLabel}>Toplam Emlak</div>
              </div>

              {/* Total inquiries stat card */}
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.totalInquiries}</div>
                <div className={styles.statLabel}>Toplam Talep</div>
              </div>

              {/* Featured properties count */}
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.featuredCount}</div>
                <div className={styles.statLabel}>Öne Çıkan</div>
              </div>
            </div>

            {/* Last 5 inquiries section — quick overview of recent activity */}
            <div className={styles.recentSection}>
              <h2 className={styles.sectionTitle}>Son Talepler</h2>
              {inquiries.length === 0 ? (
                /* Empty state — no inquiries yet */
                <p className={styles.emptyState}>Henüz talep bulunmuyor.</p>
              ) : (
                /* Show the 5 most recent inquiries */
                <div className={styles.recentList}>
                  {inquiries.slice(0, 5).map((inquiry) => (
                    <div key={inquiry.id} className={styles.recentItem}>
                      <div className={styles.recentItemHeader}>
                        {/* Sender name */}
                        <span className={styles.recentName}>{inquiry.name}</span>
                        {/* Read/unread badge */}
                        <span
                          className={`${styles.badge} ${
                            inquiry.read ? styles.badgeRead : styles.badgeUnread
                          }`}
                        >
                          {inquiry.read ? 'Okundu' : 'Yeni'}
                        </span>
                      </div>
                      {/* Message preview — truncated to first 100 characters */}
                      <p className={styles.recentMessage}>
                        {inquiry.message.length > 100
                          ? `${inquiry.message.substring(0, 100)}...`
                          : inquiry.message}
                      </p>
                      {/* Date — formatted as Turkish locale */}
                      <span className={styles.recentDate}>
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: EMLAKLAR (Properties)                                 */}
        {/* Paginated table with title, location, price, featured, edit  */}
        {/* ============================================================ */}
        {activeTab === 'properties' && (
          <>
            {properties.length === 0 ? (
              /* Empty state — no properties in the database */
              <p className={styles.emptyState}>
                Henüz emlak bulunmuyor. &quot;Emlak Ekle&quot; butonuna tıklayarak başlayın.
              </p>
            ) : (
              <>
                {/* Properties table — responsive with horizontal scroll on mobile */}
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    {/* Table header — Turkish column labels */}
                    <thead>
                      <tr>
                        <th className={styles.tableHeader}>Başlık</th>
                        <th className={styles.tableHeader}>Konum</th>
                        <th className={styles.tableHeader}>Fiyat</th>
                        <th className={styles.tableHeader}>Öne Çıkan</th>
                        <th className={styles.tableHeader}>İşlemler</th>
                      </tr>
                    </thead>
                    {/* Table body — paginated property rows */}
                    <tbody>
                      {paginatedProperties.map((property) => (
                        <tr key={property.id}>
                          {/* Property title */}
                          <td className={styles.tableCell}>{property.title}</td>
                          {/* Property location */}
                          <td className={styles.tableCell}>{property.location}</td>
                          {/* Formatted price with euro sign */}
                          <td className={styles.tableCell}>{formatPrice(property.price)}</td>
                          {/* Featured status — Turkish "Evet"/"Hayir" (Yes/No) */}
                          <td className={styles.tableCell}>
                            {property.featured ? 'Evet' : 'Hayır'}
                          </td>
                          {/* Edit link — navigates to the property edit page */}
                          <td className={styles.tableCell}>
                            <button
                              className={styles.editLink}
                              onClick={() =>
                                router.push(
                                  `/${locale}/nmo-bbo-141522/properties/${property.id}`
                                )
                              }
                            >
                              Düzenle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — only shown if more than 1 page */}
                {totalPropertyPages > 1 && (
                  <div className={styles.pagination}>
                    {getPageNumbers(totalPropertyPages).map((page) => (
                      <button
                        key={page}
                        className={`${styles.pageButton} ${
                          propertyPage === page ? styles.pageButtonActive : ''
                        }`}
                        onClick={() => setPropertyPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 3: TALEPLER (Inquiries)                                  */}
        {/* Paginated list with name, email, message, read/unread toggle */}
        {/* ============================================================ */}
        {activeTab === 'inquiries' && (
          <>
            {inquiries.length === 0 ? (
              /* Empty state — no inquiries */
              <p className={styles.emptyState}>Henüz talep bulunmuyor.</p>
            ) : (
              <>
                {/* Inquiries list — card-style layout */}
                <div className={styles.inquiryList}>
                  {paginatedInquiries.map((inquiry) => (
                    <div key={inquiry.id} className={styles.inquiryItem}>
                      {/* Inquiry header — name, email, property, date, badge */}
                      <div className={styles.inquiryHeader}>
                        <div className={styles.inquiryInfo}>
                          {/* Sender name */}
                          <span className={styles.inquiryName}>{inquiry.name}</span>
                          {/* Sender email */}
                          <span className={styles.inquiryEmail}>{inquiry.email}</span>
                        </div>
                        <div className={styles.inquiryMeta}>
                          {/* Property reference (if inquiry was about a specific property) */}
                          {inquiry.property && (
                            <span className={styles.inquiryProperty}>
                              {inquiry.property}
                            </span>
                          )}
                          {/* Submission date */}
                          <span className={styles.inquiryDate}>
                            {formatDate(inquiry.createdAt)}
                          </span>
                          {/* Read/unread badge — clickable to toggle status */}
                          <button
                            className={`${styles.badge} ${
                              inquiry.read ? styles.badgeRead : styles.badgeUnread
                            }`}
                            onClick={() => toggleInquiryRead(inquiry.id, inquiry.read)}
                            title={inquiry.read ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                          >
                            {inquiry.read ? 'Okundu' : 'Yeni'}
                          </button>
                        </div>
                      </div>
                      {/* Inquiry message body */}
                      <p className={styles.inquiryMessage}>{inquiry.message}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination — only shown if more than 1 page */}
                {totalInquiryPages > 1 && (
                  <div className={styles.pagination}>
                    {getPageNumbers(totalInquiryPages).map((page) => (
                      <button
                        key={page}
                        className={`${styles.pageButton} ${
                          inquiryPage === page ? styles.pageButtonActive : ''
                        }`}
                        onClick={() => setInquiryPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 4: TEMSILCI PROFILI (Agent Profile)                      */}
        {/* Agent info display + edit link                               */}
        {/* ============================================================ */}
        {activeTab === 'agent' && (
          <>
            {!agent ? (
              /* Empty state — no agent record (shouldn't happen in production) */
              <p className={styles.emptyState}>
                Temsilci profili bulunamadı.
              </p>
            ) : (
              /* Agent profile card */
              <div className={styles.agentCard}>
                {/* Agent name */}
                <h2 className={styles.agentName}>{agent.name}</h2>
                {/* Agent professional title */}
                <p className={styles.agentTitle}>{agent.title}</p>

                {/* Agent details grid — key info at a glance */}
                <div className={styles.agentDetails}>
                  {/* Email */}
                  <div className={styles.agentDetail}>
                    <span className={styles.agentDetailLabel}>E-posta</span>
                    <span className={styles.agentDetailValue}>{agent.email}</span>
                  </div>
                  {/* Phone */}
                  <div className={styles.agentDetail}>
                    <span className={styles.agentDetailLabel}>Telefon</span>
                    <span className={styles.agentDetailValue}>{agent.phone}</span>
                  </div>
                  {/* Listings count */}
                  <div className={styles.agentDetail}>
                    <span className={styles.agentDetailLabel}>İlanlar</span>
                    <span className={styles.agentDetailValue}>{agent.listings}</span>
                  </div>
                </div>

                {/* Bio preview — English bio as fallback, truncated */}
                <div className={styles.agentBio}>
                  <span className={styles.agentDetailLabel}>Biyografi (EN)</span>
                  <p className={styles.agentBioText}>
                    {agent.bio.length > 200
                      ? `${agent.bio.substring(0, 200)}...`
                      : agent.bio}
                  </p>
                </div>

                {/* "Profili Duzenle" = Edit Profile — links to agent edit page */}
                <button
                  className={styles.addButton}
                  onClick={() =>
                    router.push(`/${locale}/nmo-bbo-141522/agent/${agent.id}`)
                  }
                >
                  Profili Düzenle
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
