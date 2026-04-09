/**
 * app/api/properties/[id]/route.ts — Single property API (read, update, delete)
 *
 * Handles:
 * - GET: Returns a single property by ID (public, no auth required)
 * - PUT: Updates an existing property (auth required — admin only)
 * - DELETE: Deletes a property and its Cloudinary images (auth required)
 *
 * Security:
 * - GET is public — used by property detail page
 * - PUT and DELETE require a valid NextAuth session
 * - DELETE also cleans up Cloudinary images to prevent orphaned storage
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/auth'
import cloudinary from '@/app/lib/cloudinary'

/**
 * GET /api/properties/[id] — Fetch a single property by ID
 * No authentication required — used by public property detail page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    /* Fetch the property by its integer ID */
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
    })

    /* Return 404 if property not found */
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Failed to fetch property:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/properties/[id] — Update an existing property
 * Requires authentication — only admin can update properties
 * Validates required fields: title, price, location
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

    /* Update the property in the database */
    const property = await prisma.property.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        description: body.description || '',
        descriptionTr: body.descriptionTr || null,
        descriptionRu: body.descriptionRu || null,
        descriptionAr: body.descriptionAr || null,
        price: parseFloat(body.price),
        location: body.location,
        /* Turkish "X+Y" convention:
           bedrooms    = X (number of bedrooms)
           livingRooms = Y (number of salons)
           livingRooms defaults to 1 when omitted (the most common value) */
        bedrooms: parseInt(body.bedrooms) || 0,
        livingRooms: parseInt(body.livingRooms) || 1,
        bathrooms: parseInt(body.bathrooms) || 0,
        area: parseFloat(body.area) || 0,
        imageIds: body.imageIds || [],
        videoId: body.videoId || null,
        featured: body.featured === true,
        forSale: body.forSale !== false,
      },
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error('Failed to update property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/properties/[id] — Delete a property
 * Requires authentication — only admin can delete properties
 * Also deletes associated Cloudinary images to prevent orphaned storage
 */
export async function DELETE(
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

    /* Fetch the property first to get its image IDs for Cloudinary cleanup */
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
    })

    /* Clean up Cloudinary images if the property has any */
    if (property?.imageIds?.length) {
      try {
        await cloudinary.api.delete_resources(property.imageIds)
      } catch (cloudinaryError) {
        /* Log but don't fail — property deletion is more important */
        console.error('Failed to delete Cloudinary images:', cloudinaryError)
      }
    }

    /* Delete the property from the database */
    await prisma.property.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
