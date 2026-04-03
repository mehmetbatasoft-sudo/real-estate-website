'use client';
/**
 * PropertyImage.tsx
 * =================
 * Server component that renders a single property listing image using Cloudinary.
 * Used throughout the site wherever a standard property photo is needed (cards,
 * listing grids, detail pages, etc.).
 *
 * This is a SERVER component -- no 'use client' directive. Next.js will render
 * it on the server and send static HTML to the client, which improves initial
 * load performance and SEO for property images.
 *
 * Design system tokens used:
 *   --color-ivory (#F5F0E8)  — placeholder background
 *   --color-warm  (#8C6B4A)  — placeholder text
 *   --color-gold  (#C9A96E)  — placeholder accent border
 *   Font: 'Cormorant Garamond', serif
 */

import { CldImage } from 'next-cloudinary';

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Props for the PropertyImage component.
 *
 * @property publicId  - The Cloudinary public ID of the image to display.
 *                       When empty or undefined the component falls back to
 *                       a styled placeholder.
 * @property alt       - Accessible alt text describing the image content.
 * @property className - Optional extra CSS class(es) forwarded to the
 *                       outermost element so parents can control sizing /
 *                       positioning.
 */
interface PropertyImageProps {
  publicId?: string;
  alt: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * PropertyImage
 * Renders a Cloudinary-optimised property photo at 800x600 with automatic
 * smart-crop, or a branded placeholder when no image is available.
 *
 * Because it is a server component, CldImage is rendered at build / request
 * time. The resulting <img> tag still benefits from Next.js image
 * optimisation (lazy-loading, srcset, etc.).
 */
export default function PropertyImage({
  publicId,
  alt,
  className,
}: PropertyImageProps) {
  /* ---- Guard: missing image ---- */
  /* If the publicId is falsy (empty string, undefined, null) we render a
     branded placeholder div instead of a broken image.                    */
  if (!publicId) {
    return (
      <div
        className={className}
        style={{
          /* Fill the parent container the same way the real image would */
          width: '100%',
          aspectRatio: '800 / 600',

          /* Luxury design system: ivory background, no rounded corners */
          backgroundColor: 'var(--color-ivory, #F5F0E8)',

          /* Thin gold border on all sides (design-system spec: 0.5px gold) */
          border: '0.5px solid var(--color-gold, #C9A96E)',

          /* Centre the "No Image" label both axes */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          /* Warm-toned text in the brand serif font */
          color: 'var(--color-warm, #8C6B4A)',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1rem',
          letterSpacing: '0.08em',
        }}
      >
        {/* Static fallback text shown when no Cloudinary ID is provided */}
        No Image
      </div>
    );
  }

  /* ---- Normal path: render the Cloudinary image ---- */
  return (
    <CldImage
      /* ---- Source ---- */
      src={publicId} /* Cloudinary public ID (e.g. "properties/villa-01") */

      /* ---- Dimensions ---- */
      width={800}  /* Intrinsic width used for srcset / aspect-ratio calc */
      height={600} /* Intrinsic height — gives a 4:3 aspect ratio         */

      /* ---- Cloudinary transformations ---- */
      crop="fill"    /* Crop to exact 800x600 box, no letterboxing */
      gravity="auto" /* Cloudinary AI picks the most interesting focal point */

      /* ---- Accessibility ---- */
      alt={alt}

      /* ---- Styling ---- */
      className={className} /* Forward parent class for external sizing */

      /* ---- Performance ---- */
      sizes="(max-width: 768px) 100vw, 800px" /* Responsive hint for the browser */
    />
  );
}
