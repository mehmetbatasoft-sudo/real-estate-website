/**
 * app/api/properties/route.ts — Properties API (list + create)
 *
 * Handles:
 * - GET: Returns all properties ordered by createdAt desc (public, no auth required)
 * - POST: Creates a new property (auth required — admin only)
 *
 * Security:
 * - GET is public — used by property listing and homepage
 * - POST requires a valid NextAuth session
 * - Input validation on title, price, and location for POST
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/auth'

/**
 * GET /api/properties — Fetch all properties
 * Returns all properties ordered by most recent first
 * No authentication required — used by public pages
 */
export async function GET() {
  try {
    /* Fetch all properties, newest first */
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/properties — Create a new property
 * Requires authentication — only admin can create properties
 * Validates required fields: title, price, location
 */
export async function POST(request: NextRequest) {
  try {
    /* Check authentication — reject if not logged in */
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* Parse the request body */
    const body = await request.json()

    /* Validate required fields */
    if (!body.title || typeof body.title !== 'string' || body.title.length > 200) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
    }

    if (!body.price || isNaN(parseFloat(body.price))) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    if (!body.location || typeof body.location !== 'string' || body.location.length > 200) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    /* Create the property in the database */
    const property = await prisma.property.create({
      data: {
        title: body.title,
        description: body.description || '',
        descriptionTr: body.descriptionTr || null,
        descriptionRu: body.descriptionRu || null,
        descriptionAr: body.descriptionAr || null,
        price: parseFloat(body.price),
        location: body.location,
        bedrooms: parseInt(body.bedrooms) || 0,
        bathrooms: parseInt(body.bathrooms) || 0,
        area: parseFloat(body.area) || 0,
        imageIds: body.imageIds || [],
        videoId: body.videoId || null,
        featured: body.featured === true,
        forSale: body.forSale !== false, /* Default to true (for sale) */
      },
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error('Failed to create property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
