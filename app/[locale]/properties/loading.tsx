/**
 * app/[locale]/properties/loading.tsx — Loading skeleton for properties page
 *
 * Displays skeleton placeholder cards while the properties page is loading.
 * Matches the grid layout of the actual properties listing page.
 * Uses CSS Modules for styling — no inline styles.
 *
 * Next.js automatically shows this component during Suspense boundaries
 * while the page's server component fetches data.
 */

import styles from './loading.module.css'

/**
 * PropertiesLoading — skeleton card grid for loading state
 * Shows 6 placeholder cards matching the properties grid layout
 */
export default function PropertiesLoading() {
  return (
    <main className={styles.container}>
      {/* Page title skeleton */}
      <div className={styles.titleSkeleton} />
      <div className={styles.subtitleSkeleton} />

      {/* Filter bar skeleton */}
      <div className={styles.filterSkeleton} />

      {/* Property card skeletons — 6 cards matching the 3-column grid */}
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.card}>
            {/* Image placeholder */}
            <div className={styles.imageSkeleton} />
            {/* Text placeholders */}
            <div className={styles.cardContent}>
              <div className={styles.textSkeleton} />
              <div className={styles.textSkeletonShort} />
              <div className={styles.textSkeletonPrice} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
