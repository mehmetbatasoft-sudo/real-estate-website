'use client';
/**
 * HeroImage.tsx
 * =============
 * Client component that renders a full-viewport hero banner image using
 * Cloudinary's CldImage in "fill" mode. Designed for landing pages and
 * property detail hero sections.
 *
 * Why 'use client'?
 *   CldImage internally relies on browser APIs (IntersectionObserver,
 *   responsive image negotiation via next/image) so it must be rendered
 *   on the client.
 *
 * Structure (DOM):
 *   <div.heroWrapper>          -- relative container, 100vh
 *     <CldImage fill />        -- background photo, object-fit cover
 *     <div.overlay />          -- dark gradient for text contrast
 *   </div>
 *
 * When no publicId is supplied the component renders a branded gradient
 * fallback (espresso -> warm brown) so the hero area is never blank.
 *
 * Design-system notes:
 *   - No border-radius on the wrapper (sharp corners per brand guidelines)
 *   - 0.5px gold borders are NOT used here (hero bleeds edge-to-edge)
 */

import { CldImage } from 'next-cloudinary';
import styles from './HeroImage.module.css';

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Props for the HeroImage component.
 *
 * @property publicId - Cloudinary public ID of the hero photograph.
 *                      When falsy the component renders a gradient fallback.
 */
interface HeroImageProps {
  publicId?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * HeroImage
 * Renders a full-bleed, viewport-height hero image with a dark gradient
 * overlay for text legibility. Falls back to a branded gradient when no
 * image is available.
 */
export default function HeroImage({ publicId }: HeroImageProps) {
  /* ---------------------------------------------------------------- */
  /*  Fallback: no image provided                                      */
  /*  Render a full-viewport gradient using brand colours so the page   */
  /*  still looks intentional even without a photo.                     */
  /* ---------------------------------------------------------------- */
  if (!publicId) {
    return (
      <div className={styles.heroWrapper}>
        {/* Gradient background that mimics the hero layout */}
        <div className={styles.fallback} />

        {/* Overlay is still rendered on top of the fallback so any
            text / headings placed as siblings remain legible. */}
        <div className={styles.overlay} />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Normal path: Cloudinary hero image                               */
  /* ---------------------------------------------------------------- */
  return (
    <div className={styles.heroWrapper}>
      {/* ---- Hero photograph ---- */}
      <CldImage
        src={publicId}            /* Cloudinary public ID                  */
        alt="Hero image"          /* Generic alt — parent can override via
                                     a visually-hidden heading if needed   */
        fill                      /* Next.js fill layout — image stretches
                                     to cover the nearest positioned parent */
        priority                  /* Preload this image — it is above the
                                     fold and critical for LCP             */
        className={styles.heroImage} /* object-fit:cover + right-centre
                                        anchor defined in the CSS module   */
        sizes="100vw"             /* The hero always spans the full viewport */
      />

      {/* ---- Dark gradient overlay ---- */}
      {/* Positioned absolute via CSS (inset: 0). Provides a top-to-bottom
          gradient from 30 % to 50 % black so that heading text on top of
          the hero image remains readable regardless of photo brightness. */}
      <div className={styles.overlay} />
    </div>
  );
}
