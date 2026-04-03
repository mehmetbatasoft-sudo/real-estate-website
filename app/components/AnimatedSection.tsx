'use client';
/**
 * AnimatedSection.tsx
 *
 * A reusable scroll-triggered fade-up animation wrapper for the luxury real
 * estate website.  It uses GSAP with the ScrollTrigger plugin to animate any
 * child content into view as the user scrolls down the page.
 *
 * Usage:
 *   <AnimatedSection>
 *     <h2>Featured Properties</h2>
 *   </AnimatedSection>
 *
 *   <AnimatedSection className="mt-12" delay={0.3}>
 *     <PropertyCard ... />
 *   </AnimatedSection>
 *
 * How it works:
 *   1. A container <div> wraps the children and starts fully transparent
 *      and shifted 50 px downward.
 *   2. When the top of the container reaches 80 % of the viewport height,
 *      GSAP tweens the element to full opacity and its natural position.
 *   3. The animation fires only once (once: true) so repeat visits to the
 *      same section do not replay the effect.
 *   4. On component unmount the ScrollTrigger instance is killed to prevent
 *      memory leaks and orphaned scroll listeners.
 */


import React, { useRef, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Register the ScrollTrigger plugin with GSAP.
 * This must happen once before any ScrollTrigger-based animations are created.
 * Calling it at module scope is safe -- GSAP deduplicates multiple registrations.
 */
gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

/** Props accepted by <AnimatedSection>. */
interface AnimatedSectionProps {
  /** The content to wrap and animate into view. */
  children: ReactNode;

  /** Optional extra CSS classes forwarded to the wrapper <div>. */
  className?: string;

  /**
   * Optional delay (in seconds) before the animation starts once the
   * ScrollTrigger fires.  Useful for staggering multiple sections that
   * enter the viewport at roughly the same time.
   * @default 0
   */
  delay?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * AnimatedSection
 *
 * Wraps its children in a <div> that fades up into view when the user
 * scrolls it into the viewport.  Powered by GSAP + ScrollTrigger.
 *
 * @param props - See {@link AnimatedSectionProps}.
 * @returns A wrapper <div> containing the animated children.
 */
const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  /**
   * Ref attached to the outer container <div>.
   * GSAP targets this element for the scroll-triggered tween.
   */
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* Bail out if the ref has not been attached yet (server render guard). */
    if (!sectionRef.current) return;

    /**
     * Create the GSAP tween.
     *
     * Starting state (implicit "from" values via `from` shorthand):
     *   - opacity : 0   (fully transparent)
     *   - y       : 50  (shifted 50 px below its natural position)
     *
     * Ending state (the element's natural CSS position):
     *   - opacity : 1
     *   - y       : 0
     *
     * GSAP's `gsap.from()` animates FROM the supplied values TO the
     * element's current/computed style, which achieves the fade-up effect.
     */
    const tween = gsap.from(sectionRef.current, {
      /* --- visual properties ---------------------------------------- */
      opacity: 0, // start fully invisible
      y: 50,      // start 50 px below natural position

      /* --- timing --------------------------------------------------- */
      duration: 1,           // animation lasts 1 second
      delay,                 // caller-supplied stagger delay
      ease: 'power3.out',   // fast start, gentle deceleration -- feels premium

      /* --- scroll trigger configuration ----------------------------- */
      scrollTrigger: {
        trigger: sectionRef.current, // element that triggers the animation
        start: 'top 80%',           // fire when element's top hits 80% of viewport
        once: true,                  // only play the animation once
      },
    });

    /**
     * Cleanup function -- runs when the component unmounts.
     * Kills the ScrollTrigger instance associated with this tween to
     * avoid orphaned scroll listeners and potential memory leaks.
     */
    return () => {
      /* The tween's scrollTrigger property holds the ST instance. */
      if (tween.scrollTrigger) {
        tween.scrollTrigger.kill();
      }
    };
  }, [delay]); // Re-run only if the delay prop changes.

  return (
    /**
     * The wrapper <div>.
     * - Receives the ref so GSAP can target it.
     * - Forwards any extra className strings for layout / styling.
     */
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
};

export default AnimatedSection;
