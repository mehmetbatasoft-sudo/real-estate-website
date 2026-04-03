/**
 * app/[locale]/nmo-bbo-141522/properties/[id]/page.tsx — Edit Property Page
 *
 * Server component that fetches an existing property and renders the
 * PropertyForm in "edit" mode with pre-filled data.
 *
 * Security: Layer 2 auth check — redirects to login if not authenticated.
 *
 * Data fetching: Uses Prisma directly (server component advantage)
 * to fetch the property by its integer ID. Returns 404 via notFound()
 * if the property doesn't exist.
 *
 * Route: /[locale]/nmo-bbo-141522/properties/[id]
 */

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'
import PropertyForm from '@/app/components/admin/PropertyForm'

/**
 * EditPropertyPage — server component that gates access, fetches data,
 * and renders the PropertyForm in edit mode
 */
export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  /* Await both locale and id parameters from the dynamic route */
  const { locale, id } = await params

  /* Layer 2 auth check — redirect to login if no valid session */
  const session = await auth()
  if (!session) {
    redirect(`/${locale}/nmo-bbo-141522/login`)
  }

  /**
   * Fetch the property by its integer ID
   * parseInt is safe here — Prisma will throw if the ID is invalid,
   * which is caught by the try/catch in the API or triggers notFound()
   */
  const property = await prisma.property.findUnique({
    where: { id: parseInt(id) },
  })

  /* Show 404 page if the property doesn't exist */
  if (!property) {
    notFound()
  }

  /**
   * Serialize the property data for the client component
   * Prisma returns Date objects and potentially BigInt values
   * that need to be converted to JSON-safe types
   */
  const serializedProperty = JSON.parse(JSON.stringify(property))

  return (
    /**
     * Render PropertyForm in edit mode
     * When 'property' prop is provided, the form:
     * - Pre-fills all fields with existing data
     * - Submits via PUT to /api/properties/[id]
     * - Shows the delete button with confirmation dialog
     * No locale prop needed — PropertyForm uses useRouter from
     * '@/i18n/navigation' which auto-prepends the current locale
     */
    <PropertyForm property={serializedProperty} />
  )
}
