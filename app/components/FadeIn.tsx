'use client';
/**
 * FadeIn.tsx
 *
 * A lightweight, directional fade-in animation component built on
 * framer-motion.  It is designed for the luxury real estate website to
 * give headings, cards, and other UI elements a polished entrance as
 * they scroll into view.
 *
 * Unlike AnimatedSection (which uses GSAP), this component leverages
 * framer-motion's declarative API and its built-in viewport detection,
 * making it ideal for simpler, one-off fade-in effects without the
 * overhead of managing refs and imperative timelines.
 *
 * Usage:
 *   <FadeIn>
 *     <p>Elegant living redefined.</p>
 *   </FadeIn>
 *
 *   <FadeIn direction="left" delay={0.2} className="w-full">
 *     <ImageGallery />
 *   </FadeIn>
 */


import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** The four cardinal directions from which the element can fade in. */
type FadeDirection = 'up' | 'down' | 'left' | 'right';

/** Props accepted by <FadeIn>. */
interface FadeInProps {
  /** The content to animate into view. */
  children: ReactNode;

  /**
   * Direction the element travels FROM as it fades in.
   *   - 'up'    : slides up   (starts 30 px below)
   *   - 'down'  : slides down (starts 30 px above)
   *   - 'left'  : slides left  (starts 30 px to the right)
   *   - 'right' : slides right (starts 30 px to the left)
   * @default 'up'
   */
  direction?: FadeDirection;

  /**
   * Delay in seconds before the animation begins once the element
   * enters the viewport.  Handy for staggering sibling elements.
   * @default 0
   */
  delay?: number;

  /** Optional extra CSS classes forwarded to the wrapper motion.div. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Computes the initial x/y offset for the given fade direction.
 *
 * The element will start 30 px away in the specified direction and
 * animate toward (0, 0).  The offset distance (30 px) is intentionally
 * modest to feel subtle and luxurious rather than dramatic.
 *
 * @param direction - The cardinal direction to fade in from.
 * @returns An object with `x` and `y` pixel offsets.
 */
const getDirectionOffset = (
  direction: FadeDirection
): { x: number; y: number } => {
  switch (direction) {
    case 'up':
      /*
       * "Fade in from below" -- the element starts 30 px BELOW its
       * final position and slides upward.
       */
      return { x: 0, y: 30 };

    case 'down':
      /*
       * "Fade in from above" -- the element starts 30 px ABOVE its
       * final position and slides downward.
       */
      return { x: 0, y: -30 };

    case 'left':
      /*
       * "Fade in from the right" -- the element starts 30 px to the
       * RIGHT and slides left into place.
       */
      return { x: 30, y: 0 };

    case 'right':
      /*
       * "Fade in from the left" -- the element starts 30 px to the
       * LEFT and slides right into place.
       */
      return { x: -30, y: 0 };

    default:
      /* Fallback: no offset (pure fade, no slide). */
      return { x: 0, y: 0 };
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * FadeIn
 *
 * A motion.div wrapper that fades (and optionally slides) its children
 * into view when they enter the viewport.
 *
 * @param props - See {@link FadeInProps}.
 * @returns A framer-motion <motion.div> containing the animated children.
 */
const FadeIn: React.FC<FadeInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}) => {
  /**
   * Compute the starting x/y offsets based on the requested direction.
   * These values are used in the `initial` prop below.
   */
  const { x, y } = getDirectionOffset(direction);

  return (
    <motion.div
      /**
       * initial -- the state BEFORE the animation runs.
       *   - opacity 0 : fully transparent
       *   - x / y     : offset by 30 px in the chosen direction
       */
      initial={{ opacity: 0, x, y }}

      /**
       * whileInView -- the state the element animates TO when it
       * enters the viewport.
       *   - opacity 1 : fully visible
       *   - x: 0, y: 0 : natural (non-offset) position
       */
      whileInView={{ opacity: 1, x: 0, y: 0 }}

      /**
       * transition -- controls the timing curve and delay.
       *   - duration 0.6 s : snappy but smooth
       *   - ease 'easeOut' : decelerating curve for a natural feel
       *   - delay          : caller-supplied stagger delay
       */
      transition={{
        duration: 0.6,
        ease: 'easeOut',
        delay,
      }}

      /**
       * viewport -- configures when framer-motion considers the
       * element "in view".
       *   - once: true     : animate only the first time it scrolls in
       *   - margin: '-50px': shrinks the detection area by 50 px on
       *     every side so the animation triggers slightly after the
       *     element is already partially visible, producing a more
       *     intentional, polished feel.
       */
      viewport={{ once: true, margin: '-50px' }}

      /* Forward any extra CSS classes to the wrapper div. */
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
