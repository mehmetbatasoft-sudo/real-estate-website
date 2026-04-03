/**
 * app/api/agent/[id]/route.ts — Agent profile API (update only)
 *
 * Handles:
 * - PUT: Updates the agent profile (auth required — admin only)
 *
 * Note: There is no GET endpoint here — agent data is fetched
 * directly via Prisma in server components (prisma.agent.findFirst()).
 *
 * Single-agent architecture: Only 1 agent record exists.
 * No create or delete endpoints — only editing.
 *
 * Multilingual bios (bioTr, bioRu, bioAr) are saved as null if empty string
 * to distinguish "not translated" from "empty translation".
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/auth'

/**
 * PUT /api/agent/[id] — Update agent profile
 * Requires authentication — only admin can update agent info
 * Saves empty bio strings as null (indicates "not translated")
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    /* Check authentication — reject if not logged in */
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    /* Update the agent profile in the database */
    /* Empty bio strings are saved as null to indicate "not translated" */
    const agent = await prisma.agent.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        title: body.title,
        bio: body.bio,
        bioTr: body.bioTr || null,   /* Save as null if empty string */
        bioRu: body.bioRu || null,   /* Save as null if empty string */
        bioAr: body.bioAr || null,   /* Save as null if empty string */
        phone: body.phone,
        email: body.email,
        imageId: body.imageId,
        experience: parseInt(body.experience) || 0,
        listings: parseInt(body.listings) || 0,
        rating: parseFloat(body.rating) || 0,
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}
