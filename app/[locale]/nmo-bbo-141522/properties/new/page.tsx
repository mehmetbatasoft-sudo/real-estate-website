/**
 * app/[locale]/nmo-bbo-141522/properties/new/page.tsx — Add New Property Page
 *
 * Server component that renders the PropertyForm in "create" mode.
 * No existing property data is passed — the form starts empty.
 *
 * Security: Layer 2 auth check — redirects to login if not authenticated.
 * This runs on the server before any component renders, so unauthenticated
 * users never see the form.
 *
 * Route: /[locale]/nmo-bbo-141522/properties/new
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import PropertyForm from '@/app/components/admin/PropertyForm'

/**
 * NewPropertyPage — server component that gates access and renders the form
 * No props needed for create mode — PropertyForm defaults to create when
 * no property prop is provided
 */
export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  /* Await the locale parameter from the dynamic route */
  const { locale } = await params

  /* Layer 2 auth check — redirect to login if no valid session */
  const session = await auth()
  if (!session) {
    redirect(`/${locale}/nmo-bbo-141522/login`)
  }

  return (
    /**
     * Render PropertyForm in create mode
     * When no 'property' prop is provided, the form:
     * - Shows empty fields
     * - Submits via POST to /api/properties
     * - Does NOT show the delete button
     * No locale prop needed — PropertyForm uses useRouter from
     * '@/i18n/navigation' which auto-prepends the current locale
     */
    <PropertyForm />
  )
}
