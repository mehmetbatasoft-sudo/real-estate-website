'use client';
/**
 * app/global-error.tsx — Root-level error boundary
 *
 * This is the last-resort error boundary for the entire application.
 * It catches errors that occur outside of any locale layout,
 * including errors in the root layout itself.
 *
 * MUST include full <html> and <body> tags since the root layout
 * may have failed to render.
 *
 * Must be a 'use client' component.
 */

'use client'

/**
 * GlobalError — root error boundary component
 * Renders a minimal error page with full HTML structure
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FDFAF4',
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          {/* Error title */}
          <h1 style={{ color: '#2C1A0E', fontSize: '2rem', fontWeight: 400 }}>
            Something went wrong
          </h1>

          {/* Error description */}
          <p style={{ color: '#8C6B4A', fontSize: '1.1rem' }}>
            A critical error occurred. Please try refreshing the page.
          </p>

          {/* Try Again button */}
          <button
            onClick={reset}
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              background: '#C9A96E',
              color: '#2C1A0E',
              border: 'none',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1rem',
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
