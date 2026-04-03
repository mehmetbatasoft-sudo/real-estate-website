'use client';
/**
 * ImageGallery.tsx
 * ================
 * Client component that renders a full-featured image carousel for property
 * listings using Embla Carousel and Cloudinary images.
 *
 * Features:
 *   - Looping carousel powered by embla-carousel-react
 *   - Previous / Next navigation arrows
 *   - "1 / 5" image counter overlay
 *   - Clickable thumbnail strip below the main viewport
 *   - Graceful handling of 0, 1, and 2+ images
 *
 * Why 'use client'?
 *   The component uses React state (useState, useCallback, useEffect) and
 *   the Embla carousel hook, all of which require a client-side runtime.
 *
 * Design-system tokens used via CSS module:
 *   --color-espresso, --color-gold, --color-ivory, --color-warm
 *   Font: 'Cormorant Garamond', serif
 *   No rounded corners; 0.5px gold borders on placeholder.
 */

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CldImage } from 'next-cloudinary';
import styles from './ImageGallery.module.css';

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Props for the ImageGallery component.
 *
 * @property imageIds - Array of Cloudinary public IDs. The gallery adapts:
 *                      - 0 items  -> placeholder with "No Images" text
 *                      - 1 item   -> single image, no arrows / counter
 *                      - 2+ items -> full carousel with navigation
 */
interface ImageGalleryProps {
  imageIds: string[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * ImageGallery
 * Renders an interactive image carousel with thumbnails for property
 * detail pages. Uses Embla Carousel for smooth, accessible swiping.
 */
export default function ImageGallery({ imageIds }: ImageGalleryProps) {
  /* -------------------------------------------------------------- */
  /*  Embla Carousel setup                                           */
  /*  useEmblaCarousel returns a ref callback for the viewport DOM   */
  /*  node and an API object for programmatic control.               */
  /*  { loop: true } enables infinite looping in both directions.    */
  /* -------------------------------------------------------------- */
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  /* -------------------------------------------------------------- */
  /*  Selected slide index                                           */
  /*  Tracks which slide is currently in view so we can:             */
  /*    1. Update the "1 / 5" counter                                */
  /*    2. Highlight the active thumbnail                            */
  /* -------------------------------------------------------------- */
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  /* -------------------------------------------------------------- */
  /*  onSelect callback                                              */
  /*  Called by Embla every time the selected slide changes (swipe,   */
  /*  arrow click, thumbnail click). Reads the current index from    */
  /*  the Embla API and pushes it into React state.                  */
  /* -------------------------------------------------------------- */
  const onSelect = useCallback(() => {
    if (!emblaApi) return; /* Guard: API not ready yet */
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  /* -------------------------------------------------------------- */
  /*  Subscribe to Embla's 'select' event                            */
  /*  Runs once when emblaApi becomes available and whenever onSelect */
  /*  changes (it won't, thanks to useCallback deps).                */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!emblaApi) return; /* Guard: wait for API */

    /* Set initial index (may not be 0 if Embla re-initialises) */
    onSelect();

    /* Listen for future slide changes */
    emblaApi.on('select', onSelect);

    /* Cleanup: remove the listener when the component unmounts or
       emblaApi / onSelect change to prevent memory leaks. */
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  /* -------------------------------------------------------------- */
  /*  Navigation handlers                                            */
  /*  Thin wrappers around Embla's scrollPrev / scrollNext that      */
  /*  guard against the API being undefined during SSR / hydration.  */
  /* -------------------------------------------------------------- */

  /** Scroll the carousel to the previous slide. */
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  /** Scroll the carousel to the next slide. */
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  /**
   * scrollTo
   * Scrolls the carousel to a specific slide index.
   * Used by the thumbnail strip — clicking a thumbnail calls
   * scrollTo(index) to jump directly to that image.
   */
  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  /* ================================================================ */
  /*  RENDER: 0 images — placeholder                                  */
  /*  When the imageIds array is empty we show a styled placeholder    */
  /*  that preserves the gallery's aspect ratio so the layout stays    */
  /*  stable.                                                          */
  /* ================================================================ */
  if (imageIds.length === 0) {
    return (
      <div className={styles.galleryContainer}>
        <div className={styles.placeholder}>No Images Available</div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: 1 image — single image, no navigation                   */
  /*  With only one photo there is nothing to carousel through, so     */
  /*  we skip the arrows, counter, and thumbnail strip entirely.       */
  /* ================================================================ */
  if (imageIds.length === 1) {
    return (
      <div className={styles.galleryContainer}>
        {/* Single-image viewport — same aspect ratio as the carousel */}
        <div className={styles.viewport}>
          <div className={styles.container}>
            <div className={styles.slide}>
              {/* CldImage in fill mode stretches to cover the slide div */}
              <CldImage
                src={imageIds[0]}      /* Cloudinary public ID            */
                alt="Property image"   /* Accessible description          */
                fill                   /* Next.js fill layout             */
                sizes="100vw"          /* Full viewport width             */
                style={{
                  objectFit: 'cover',  /* Cover the slide, crop excess   */
                }}
              />
            </div>
          </div>
        </div>
        {/* No arrows, counter, or thumbnails for a single image */}
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: 2+ images — full carousel with navigation               */
  /*  This is the main path. We render:                                */
  /*    1. The Embla viewport + slides                                 */
  /*    2. Prev / Next arrow buttons                                   */
  /*    3. An image counter ("1 / 5")                                  */
  /*    4. A clickable thumbnail strip                                 */
  /* ================================================================ */
  return (
    <div className={styles.galleryContainer}>
      {/* ----------------------------------------------------------
          Main carousel viewport
          emblaRef is attached here so Embla can measure the container
          and manage the scroll position of the inner .container.
      ---------------------------------------------------------- */}
      <div className={styles.viewport} ref={emblaRef}>
        {/* Flex container that holds all slides side by side */}
        <div className={styles.container}>
          {imageIds.map((id, index) => (
            /* Each slide is 100 % wide; Embla translates the container
               so only one slide is visible at a time. */
            <div className={styles.slide} key={id + index}>
              <CldImage
                src={id}                     /* Cloudinary public ID       */
                alt={`Property image ${index + 1}`} /* Numbered alt text  */
                fill                         /* Fill the slide container   */
                sizes="100vw"                /* Hint: full viewport width  */
                priority={index === 0}       /* Preload the first image    */
                style={{
                  objectFit: 'cover',        /* Cover the slide area       */
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------
          Previous arrow button
          Positioned absolute, vertically centred on the left edge.
      ---------------------------------------------------------- */}
      <button
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={scrollPrev}
        aria-label="Previous image"
        type="button"
      >
        {/* Left-pointing arrow character (chevron) */}
        &#8249;
      </button>

      {/* ----------------------------------------------------------
          Next arrow button
          Positioned absolute, vertically centred on the right edge.
      ---------------------------------------------------------- */}
      <button
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={scrollNext}
        aria-label="Next image"
        type="button"
      >
        {/* Right-pointing arrow character (chevron) */}
        &#8250;
      </button>

      {/* ----------------------------------------------------------
          Image counter
          Shows the human-readable position "1 / 5" (1-indexed).
          Anchored to the bottom-right corner of the viewport.
      ---------------------------------------------------------- */}
      <span className={styles.counter}>
        {selectedIndex + 1} / {imageIds.length}
      </span>

      {/* ----------------------------------------------------------
          Thumbnail strip
          A horizontally scrollable row of small preview images.
          Clicking a thumbnail scrolls the main carousel to that
          slide. The active thumbnail has full opacity + gold border.
      ---------------------------------------------------------- */}
      <div className={styles.thumbnails}>
        {imageIds.map((id, index) => (
          <div
            key={id + index}
            className={`${styles.thumbnail} ${
              index === selectedIndex ? styles.thumbnailActive : ''
            }`}
            /* Clicking a thumbnail scrolls the carousel to that slide */
            onClick={() => scrollTo(index)}
            /* Keyboard accessibility: allow Enter / Space activation */
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollTo(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Go to image ${index + 1}`}
          >
            {/* Thumbnail Cloudinary image — fill mode covers the 80x60 box */}
            <CldImage
              src={id}                           /* Cloudinary public ID    */
              alt={`Thumbnail ${index + 1}`}     /* Accessible description  */
              fill                               /* Fill the thumbnail div  */
              sizes="80px"                       /* Small fixed size hint   */
              style={{
                objectFit: 'cover',              /* Cover without distortion */
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
