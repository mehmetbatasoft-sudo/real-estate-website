'use client';

/**
 * Navbar.tsx — Fixed navigation bar for Özgül's Realty
 *
 * This is a 'use client' component that renders the site-wide navigation bar.
 * It provides:
 * - Fixed top positioning with transparent-to-solid scroll transition
 * - Desktop navigation: logo, page links, language dropdown, CTA button
 * - Mobile navigation: hamburger icon toggling a fullscreen overlay menu
 * - Language switching between EN, TR, RU, AR using next-intl router
 * - Automatic hiding on admin pages (pathname includes '/nmo-bbo-141522')
 * - Full RTL support for Arabic locale
 *
 * Dependencies:
 * - next-intl for translations (useTranslations), locale (useLocale),
 *   and navigation (usePathname, useRouter, Link)
 * - Navbar.module.css for all styling via CSS Modules
 *
 * State:
 * - scrolled (boolean): true when page scrolled > 50px, triggers bg change
 * - mobileMenuOpen (boolean): toggles the mobile fullscreen overlay
 * - languageDropdownOpen (boolean): toggles the desktop locale dropdown
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import styles from './Navbar.module.css';

/**
 * SUPPORTED_LOCALES — Array of locale codes the site supports
 * Used to render language switcher options in both desktop and mobile menus
 * Order: English, Turkish, Russian, Arabic
 */
const SUPPORTED_LOCALES = ['en', 'tr', 'ru', 'ar'] as const;

/**
 * LOCALE_LABELS — Human-readable labels for each supported locale
 * Displayed in the language dropdown and mobile language buttons
 */
const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  tr: 'TR',
  ru: 'RU',
  ar: 'AR',
};

/**
 * SCROLL_THRESHOLD — Pixel count before navbar background becomes opaque
 * When window.scrollY exceeds this value, the navbar gains the espresso bg
 */
const SCROLL_THRESHOLD = 50;

/**
 * Navbar — Main navigation component
 *
 * Renders a fixed-position navigation bar at the top of the page.
 * Automatically hides itself on admin pages by returning null
 * when the pathname includes '/nmo-bbo-141522'.
 *
 * @returns JSX.Element | null — The navbar UI, or null on admin routes
 */
export default function Navbar() {
  /* ---- Hooks: i18n navigation and translation ---- */

  /** Current URL pathname (without locale prefix) — used for active link detection and admin check */
  const pathname = usePathname();

  /** next-intl router — used for programmatic locale switching via router.push */
  const router = useRouter();

  /** Current active locale code (e.g., 'en', 'tr', 'ru', 'ar') */
  const locale = useLocale();

  /** Translation function scoped to the 'nav' namespace in messages files */
  const t = useTranslations('nav');

  /* ---- State ---- */

  /** Whether the user has scrolled past SCROLL_THRESHOLD (50px) */
  const [scrolled, setScrolled] = useState(false);

  /** Whether the mobile fullscreen overlay menu is open */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /** Whether the desktop language dropdown is visible */
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  /* ---- Effects ---- */

  /**
   * Scroll listener effect
   * Attaches a scroll event listener to window that updates the `scrolled` state.
   * When scrollY > 50px, the navbar background transitions from transparent to
   * espresso (#2C1A0E at 0.95 opacity) via the .navbarScrolled CSS class.
   * Cleans up the listener on unmount to prevent memory leaks.
   */
  useEffect(() => {
    /** handleScroll — Updates scrolled state based on current scroll position */
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    /* Set initial state in case the page loads already scrolled (e.g., browser restore) */
    handleScroll();

    /* Attach scroll listener with passive flag for better performance */
    window.addEventListener('scroll', handleScroll, { passive: true });

    /* Cleanup: remove the scroll listener when the component unmounts */
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Body overflow lock effect
   * When the mobile menu is open, prevents the background page from scrolling
   * by setting overflow: hidden on the body element.
   * Restores normal scrolling when the menu closes or the component unmounts.
   */
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    /* Cleanup: ensure overflow is restored if component unmounts while menu is open */
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  /* ---- Handlers ---- */

  /**
   * handleLocaleSwitch — Switches the site to a different locale
   * Replaces the current locale segment in the pathname and navigates
   * using the next-intl router, which automatically handles locale prefixing.
   *
   * @param newLocale — The locale code to switch to (e.g., 'tr', 'ar')
   */
  const handleLocaleSwitch = useCallback(
    (newLocale: string) => {
      /* Use router.push with the current pathname — next-intl handles locale prefixing */
      router.push(pathname, { locale: newLocale });

      /* Close both the language dropdown and mobile menu after switching */
      setLanguageDropdownOpen(false);
      setMobileMenuOpen(false);
    },
    [pathname, router]
  );

  /**
   * toggleMobileMenu — Toggles the mobile fullscreen overlay on/off
   * Flips the mobileMenuOpen state boolean
   */
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  /**
   * toggleLanguageDropdown — Toggles the desktop language dropdown visibility
   * Flips the languageDropdownOpen state boolean
   */
  const toggleLanguageDropdown = useCallback(() => {
    setLanguageDropdownOpen((prev) => !prev);
  }, []);

  /**
   * closeMobileMenu — Closes the mobile menu
   * Called when a mobile nav link is clicked so the overlay disappears
   */
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  /* ---- Admin Route Guard ---- */

  /**
   * CRITICAL: Hide navbar on admin pages
   * The admin panel lives under /nmo-bbo-141522 — it has its own layout
   * and should not display the public-facing navigation bar.
   * Returns null to render nothing when on admin routes.
   */
  if (pathname.includes('/nmo-bbo-141522')) {
    return null;
  }

  /* ---- Navigation Links Configuration ---- */

  /**
   * NAV_LINKS — Array of objects defining each navigation link
   * href: the path (next-intl Link auto-adds locale prefix)
   * labelKey: translation key under the 'nav' namespace
   */
  const NAV_LINKS = [
    { href: '/properties', labelKey: 'properties' },
    { href: '/about', labelKey: 'about' },
  ] as const;

  /* ---- Render ---- */

  return (
    <>
      {/* ============================================================
          Main Navbar — Fixed top bar
          Combines base .navbar with conditional .navbarScrolled
          ============================================================ */}
      <nav
        className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}
        role="navigation"
        aria-label={t('ariaLabel')}
      >
        <div className={styles.container}>
          {/* ---- Logo / Brand ---- */}
          {/* Links to home page; next-intl Link auto-prefixes the locale */}
          <Link href="/" className={styles.logo}>
            {t('brand')}
          </Link>

          {/* ============================================================
              Desktop Navigation Links
              Hidden on mobile via CSS (display: none below 768px)
              ============================================================ */}
          <div className={styles.navLinks}>
            {/* Render each nav link from the NAV_LINKS config */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${
                  pathname === link.href ? styles.activeLink : ''
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {/* ---- Language Dropdown (Desktop) ---- */}
            {/* Positioned relative; dropdown menu is absolute below */}
            <div className={styles.languageDropdown}>
              {/* Button showing current locale abbreviation */}
              <button
                className={styles.languageButton}
                onClick={toggleLanguageDropdown}
                aria-expanded={languageDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('languageSwitch')}
                type="button"
              >
                {LOCALE_LABELS[locale] || locale.toUpperCase()}
              </button>

              {/* Dropdown menu — only rendered when open */}
              {languageDropdownOpen && (
                <div className={styles.languageMenu} role="listbox">
                  {SUPPORTED_LOCALES.map((loc) => (
                    <button
                      key={loc}
                      className={styles.languageOption}
                      onClick={() => handleLocaleSwitch(loc)}
                      role="option"
                      aria-selected={locale === loc}
                      type="button"
                    >
                      {LOCALE_LABELS[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ---- CTA Button (Desktop) ---- */}
            {/* Scrolls to the #contact section on the current page */}
            <a href="#contact" className={styles.ctaButton}>
              {t('getInTouch')}
            </a>
          </div>

          {/* ============================================================
              Hamburger Button (Mobile)
              Visible only below 768px; toggles the fullscreen overlay
              Three span bars form the classic hamburger icon
              ============================================================ */}
          <button
            className={styles.hamburger}
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
            type="button"
          >
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
          </button>
        </div>
      </nav>

      {/* ============================================================
          Mobile Fullscreen Overlay Menu
          Rendered only when mobileMenuOpen is true
          Covers the entire viewport with espresso background
          Contains: nav links, language switcher, CTA button
          ============================================================ */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {/* Mobile nav links — larger font for easy tapping */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${
                pathname === link.href ? styles.mobileActiveLink : ''
              }`}
              onClick={closeMobileMenu}
            >
              {t(link.labelKey)}
            </Link>
          ))}

          {/* ---- Mobile Language Switcher ---- */}
          {/* Row of locale buttons; active locale is highlighted */}
          <div className={styles.mobileLanguageSection}>
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                className={`${styles.mobileLanguageButton} ${
                  locale === loc ? styles.mobileLanguageButtonActive : ''
                }`}
                onClick={() => handleLocaleSwitch(loc)}
                type="button"
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>

          {/* ---- Mobile CTA Button ---- */}
          {/* Same "Get In Touch" action, styled for mobile */}
          <a
            href="#contact"
            className={styles.mobileCta}
            onClick={closeMobileMenu}
          >
            {t('getInTouch')}
          </a>
        </div>
      )}
    </>
  );
}
