'use client';

/**
 * PropertySlider.tsx — Horizontal carousel wrapper for property cards
 *
 * This 'use client' component wraps an arbitrary set of property cards
 * (passed as children) inside a horizontally-scrolling container with
 * native CSS scroll-snap behaviour plus explicit previous/next buttons
 * for users on desktop or anyone who prefers clicking over swiping.
 *
 * Responsibilities:
 * - Render a horizontal flex container that snaps to each child card.
 * - Provide circular prev/next buttons that call scrollBy() programmatically.
 * - Disable the prev/next buttons when the user has reached either end.
 * - Recalculate button state on scroll and on window resize.
 *
 * Styling lives in PropertySlider.module.css. Direct children receive a
 * fixed flex-basis so 3 cards are visible at once on desktop, 2 on tablet
 * and 1 on mobile.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './PropertySlider.module.css';

/**
 * Props for PropertySlider
 * children -- the individual property cards (or any JSX) to render inside the slider
 */
interface PropertySliderProps {
  children: React.ReactNode;
}

/**
 * PropertySlider — horizontal carousel for property cards
 *
 * Wraps children in a scroll-snap container with prev/next navigation buttons.
 * Buttons automatically disable when the user reaches the start or end of the slider.
 */
export default function PropertySlider({ children }: PropertySliderProps) {
  /** Ref to the horizontally-scrolling container element */
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Whether the user can scroll further to the left (false at start) */
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  /** Whether the user can scroll further to the right (false at end) */
  const [canScrollRight, setCanScrollRight] = useState(true);

  /**
   * updateScrollButtons — recalculates which nav buttons should be enabled
   * based on the current scrollLeft / scrollWidth / clientWidth of the container.
   */
  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    /* Subtract 1px to avoid rounding glitches at the rightmost position */
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  /**
   * scroll — programmatic scrolling triggered by the prev/next buttons
   * Scrolls roughly 80% of the visible width so the next "page" of cards
   * slides into view smoothly.
   *
   * @param direction -- 'left' or 'right'
   */
  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  /**
   * Effect: attach scroll + resize listeners to update button enabled state
   * Runs once on mount and cleans up on unmount.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    /* Initial calculation for the first render */
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  /**
   * Effect: smart wheel handler that fixes the "invisible barrier" bug.
   *
   * Before this handler existed the container used `data-lenis-prevent` to
   * keep Lenis's smooth-scroll from hijacking horizontal trackpad swipes.
   * Unfortunately that made Lenis ignore ALL wheel events on the slider,
   * and because the container is overflow-y: hidden the browser had nowhere
   * to put vertical wheel deltas -- so pointing the mouse at the slider and
   * scrolling up/down would mysteriously fail to move the page.
   *
   * The fix: handle wheel events ourselves and only intercept events where
   * the user's intent is clearly horizontal. Vertical intent is allowed to
   * bubble up to Lenis's window-level handler so the page scrolls normally.
   *
   * Intent detection: if |deltaX| > |deltaY| the user is swiping sideways
   * (trackpad two-finger swipe, Shift+Wheel, or horizontal-only mouse).
   * In that case we preventDefault + stopPropagation and manually drive
   * the container's scrollLeft so Lenis never sees the event. Otherwise we
   * do nothing and Lenis handles page scrolling as usual.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      /* Vertical intent (including plain mouse wheel): let Lenis handle it */
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

      /* Horizontal intent: stop Lenis from seeing this event and scroll ourselves */
      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft += e.deltaX;
    };

    /* passive: false is required because we call preventDefault */
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className={styles.sliderWrapper}>
      {/* Previous button — scrolls one "page" to the left */}
      <button
        type="button"
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Previous properties"
      >
        <span aria-hidden="true">&larr;</span>
      </button>

      {/* Scroll container — holds all the property cards.
          Horizontal intent (trackpad swipes, Shift+Wheel) is handled by the
          smart wheel handler in the useEffect above; vertical wheel events
          bubble up to Lenis so the page scrolls normally even when the
          mouse is hovering over the slider. */}
      <div
        ref={scrollRef}
        className={styles.scrollContainer}
      >
        {children}
      </div>

      {/* Next button — scrolls one "page" to the right */}
      <button
        type="button"
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Next properties"
      >
        <span aria-hidden="true">&rarr;</span>
      </button>
    </div>
  );
}
