/**
 * app/[locale]/nmo-bbo-141522/page.tsx — Admin Dashboard Page (Server Component)
 *
 * This is the main admin dashboard entry point.
 * As a server component, it handles two critical responsibilities:
 *
 * 1. AUTHENTICATION CHECK — Calls auth() to verify the admin session.
 *    If not authenticated, redirects to the login page immediately.
 *    This is Layer 2 of the three-layer security system:
 *    - Layer 1: proxy.ts middleware (redirects before page loads)
 *    - Layer 2: This page.tsx check (server-side redirect)
 *    - Layer 3: API routes check auth() before mutations
 *
 * 2. DATA FETCHING — Fetches all data needed by the dashboard:
 *    - All properties (for the properties tab and stats)
 *    - All inquiries (for the inquiries tab and unread count)
 *    - All agents (for the agent profile tab — single-agent architecture)
 *    Data is passed as props to the client-side AdminDashboard component.
 *
 * Why server component for data fetching?
 * - Direct Prisma access (no API round-trip)
 * - No client-side loading states needed for initial data
 * - Sensitive database queries never exposed to client bundle
 *
 * Route: /[locale]/nmo-bbo-141522
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'
import AdminDashboard from '@/app/components/admin/AdminDashboard'

/**
 * AdminDashboardPage — server component that gates access and fetches data
 * Awaits the locale param, checks auth, fetches all data, renders client component
 */
export default async function AdminDashboardPage({
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

  /**
   * Fetch all data in parallel using Promise.all for optimal performance
   * - Properties: ordered by newest first (most relevant in admin context)
   * - Inquiries: ordered by newest first (admin needs to see latest inquiries)
   * - Agents: fetch all (single-agent architecture — will always be 1 record)
   */
  const [properties, inquiries, agents] = await Promise.all([
    prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agent.findMany(),
  ])

  /**
   * Serialize dates and BigInt values for client component
   * Prisma returns Date objects which need to be serialized for client props
   * JSON.parse(JSON.stringify(...)) converts Dates to ISO strings
   */
  const serializedProperties = JSON.parse(JSON.stringify(properties))
  const serializedInquiries = JSON.parse(JSON.stringify(inquiries))
  const serializedAgents = JSON.parse(JSON.stringify(agents))

  return (
    /* Pass all fetched data as props to the client-side AdminDashboard */
    <AdminDashboard
      properties={serializedProperties}
      inquiries={serializedInquiries}
      agents={serializedAgents}
      locale={locale}
    />
  )
}
