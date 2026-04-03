'use client';
/**
 * SmoothScroll.tsx
 *
 * A global smooth-scrolling provider for the luxury real estate website.
 * It uses the Lenis library (@studio-freight/lenis) to intercept native
 * browser scrolling and replace it with a buttery-smooth, momentum-based
 * scroll experience -- the kind of micro-interaction that elevates a
 * premium property showcase.
 *
 * This component renders NO visible UI.  It should be mounted once,
 * typically near the root of the application (e.g., inside the root
 * layout), so that every page benefits from smooth scrolling.
 *
 * Usage (in app/layout.tsx or a top-level wrapper):
 *   import SmoothScroll from '@/app/components/SmoothScroll';
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html lang="en">
 *         <body>
 *           <SmoothScroll />
 *           {children}
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * How it works:
 *   1. On mount, a new Lenis instance is created with tuned physics
 *      (duration, easing, smooth flag).
 *   2. A requestAnimationFrame (rAF) loop continuously feeds the
 *      current timestamp to lenis.raf(), which drives the interpolated
 *      scroll position.
 *   3. On unmount, the Lenis instance is destroyed and the rAF loop
 *      is cancelled to prevent memory leaks.
 */


import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * SmoothScroll
 *
 * Initialises Lenis smooth scrolling globally.  Returns null because it
 * has no visual representation -- it only attaches scroll-intercepting
 * behaviour to the page.
 *
 * @returns null (renders nothing to the DOM).
 */
const SmoothScroll: React.FC = () => {
  useEffect(() => {
    /**
     * Create a new Lenis instance with luxury-tuned settings.
     *
     * Options explained:
     *   - duration (1.2)   : Controls how long the smooth scroll
     *     interpolation takes to settle.  1.2 s gives a relaxed,
     *     premium feel without feeling sluggish.
     *
     *   - easing            : A custom easing function that produces an
     *     exponential-decay curve.  The formula
     *       Math.min(1, 1.001 - Math.pow(2, -10 * t))
     *     starts fast and gently decelerates, closely matching the
     *     "ease-out-expo" curve.  The 1.001 offset avoids a floating-
     *     point edge case where the result could slightly exceed 1.
     *
     *   - smooth (true)     : Enables the smooth-scroll behaviour.
     *     When false, Lenis falls back to native scrolling.
     */
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    /**
     * The requestAnimationFrame loop.
     *
     * Lenis does not manage its own frame loop -- the consumer is
     * responsible for calling lenis.raf(time) on every animation frame.
     * This keeps the library lightweight and gives advanced users the
     * option to sync with GSAP's ticker or other frame sources.
     *
     * @param time - The DOMHighResTimeStamp provided by rAF.
     */
    function raf(time: number): void {
      /* Advance Lenis's internal interpolation by one frame. */
      lenis.raf(time);

      /* Schedule the next frame, storing the ID so we can cancel later. */
      rafId = requestAnimationFrame(raf);
    }

    /**
     * Stores the current requestAnimationFrame ID so the loop can be
     * cleanly cancelled during cleanup.
     */
    let rafId: number = requestAnimationFrame(raf);

    /**
     * Cleanup function -- runs when the component unmounts.
     *
     * 1. Cancel the rAF loop to stop feeding frames to a destroyed
     *    Lenis instance (prevents "ghost" scrolling and memory leaks).
     * 2. Destroy the Lenis instance, which removes all event listeners
     *    it attached to the window/document.
     */
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []); // Empty dependency array -- run once on mount, clean up on unmount.

  /**
   * This component has no visual output.  It exists solely to attach
   * the Lenis smooth-scroll behaviour to the page.
   */
  return null;
};

export default SmoothScroll;
