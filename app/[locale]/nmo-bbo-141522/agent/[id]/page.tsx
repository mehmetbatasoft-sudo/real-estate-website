/**
 * app/[locale]/nmo-bbo-141522/agent/[id]/page.tsx — Edit Agent Profile Page
 *
 * Server component that fetches the agent profile and renders the
 * AgentForm component with pre-filled data.
 *
 * SINGLE-AGENT ARCHITECTURE: This page always edits the one existing agent.
 * There is no "create agent" flow — the agent record is created during
 * database seeding (prisma/seed.ts).
 *
 * Security: Layer 2 auth check — redirects to login if not authenticated.
 *
 * Route: /[locale]/nmo-bbo-141522/agent/[id]
 */

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'
import AgentForm from '@/app/components/admin/AgentForm'

/**
 * EditAgentPage — server component that gates access, fetches agent data,
 * and renders the AgentForm
 */
export default async function EditAgentPage({
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
   * Fetch the agent by its integer ID
   * In the single-agent architecture, there's always exactly 1 record,
   * but we still validate by ID in case of URL manipulation
   */
  const agent = await prisma.agent.findUnique({
    where: { id: parseInt(id) },
  })

  /* Show 404 page if the agent doesn't exist */
  if (!agent) {
    notFound()
  }

  /**
   * Serialize the agent data for the client component
   * Converts any non-JSON-safe types (Dates, BigInts) to strings
   */
  const serializedAgent = JSON.parse(JSON.stringify(agent))

  return (
    /**
     * Render AgentForm with existing agent data
     * AgentForm is always in "edit" mode — no create mode exists
     * No locale prop needed — AgentForm uses useRouter from
     * '@/i18n/navigation' which auto-prepends the current locale
     */
    <AgentForm agent={serializedAgent} />
  )
}
