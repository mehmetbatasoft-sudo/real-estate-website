/**
 * app/api/contact/route.ts — Contact form API
 *
 * Handles:
 * - POST: Submit a new contact form inquiry (public, rate limited)
 * - PATCH: Toggle inquiry read/unread status (auth required — admin only)
 *
 * POST implements a multi-step process:
 * 1. Rate limiting (5 requests per minute per IP)
 * 2. Input validation (name, email, message required)
 * 3. Save inquiry to database
 * 4. Send email notification via Resend
 *
 * PATCH is used by the admin dashboard to mark inquiries as read/unread.
 *
 * Rate limiting uses an in-memory Map which resets on cold start.
 * For production, upgrade to Upstash Redis (see Section 21 of docs).
 *
 * Security:
 * - POST: No auth required (public form), rate limited
 * - PATCH: Auth required (admin only)
 * - All inputs validated and length-limited
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/auth'
import { Resend } from 'resend'

/* Initialize Resend email client with API key */
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * In-memory rate limiting map
 * Stores IP → { count, startTime } for each requester
 *
 * ⚠️ Limitations on Vercel:
 * - Resets on every cold start
 * - Multiple concurrent instances have separate Maps
 * - Upgrade to Upstash Redis for production
 */
const rateLimitMap = new Map<string, { count: number; startTime: number }>()
const WINDOW_MS = 60 * 1000    /* 1 minute window */
const MAX_REQUESTS = 5          /* Max 5 requests per window */

/**
 * Check rate limit for a given IP address
 * Returns true if the request is allowed, false if rate limited
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  /* No previous record — create one */
  if (!record) {
    rateLimitMap.set(ip, { count: 1, startTime: now })
    return true
  }

  /* Window expired — reset the counter */
  if (now - record.startTime > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, startTime: now })
    return true
  }

  /* Within window — check count */
  if (record.count >= MAX_REQUESTS) {
    return false
  }

  /* Within window and under limit — increment */
  record.count++
  return true
}

/**
 * POST /api/contact — Submit a contact form inquiry
 * Rate limited, validated, saved to DB, email notification sent
 */
export async function POST(request: NextRequest) {
  try {
    /* Get the requester's IP address for rate limiting */
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    /* Check rate limit — reject if too many requests */
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    /* Validate name — required, max 100 chars */
    if (!body.name || typeof body.name !== 'string' || body.name.length > 100) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    /* Validate email — required, must contain @, max 200 chars */
    if (!body.email || typeof body.email !== 'string' ||
        !body.email.includes('@') || body.email.length > 200) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    /* Validate message — required, max 2000 chars */
    if (!body.message || typeof body.message !== 'string' || body.message.length > 2000) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    /* Validate phone — optional, max 20 chars */
    if (body.phone && (typeof body.phone !== 'string' || body.phone.length > 20)) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
    }

    /* Save the inquiry to the database */
    const inquiry = await prisma.inquiry.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        message: body.message,
        property: body.property || null,
      },
    })

    /* Send email notification via Resend */
    try {
      await resend.emails.send({
        from: 'Özgül\'s Realty <onboarding@resend.dev>',
        to: process.env.CONTACT_EMAIL!,
        subject: body.property
          ? `New Inquiry: ${body.property}`
          : 'New Contact Form Submission',
        html: `
          <h2>New Inquiry from ${body.name}</h2>
          <p><strong>Name:</strong> ${body.name}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          ${body.phone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ''}
          ${body.property ? `<p><strong>Property:</strong> ${body.property}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${body.message}</p>
        `,
      })
    } catch (emailError) {
      /* Log email failure but don't fail the request — inquiry is already saved */
      console.error('Failed to send email notification:', emailError)
    }

    return NextResponse.json(inquiry)
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/contact — Update inquiry read/unread status
 * Requires authentication — only admin can toggle read status
 * Used by the admin dashboard to mark inquiries as read or unread
 *
 * Request body: { id: number, read: boolean }
 * - id: the inquiry ID to update
 * - read: the new read status (true = read, false = unread)
 */
export async function PATCH(request: NextRequest) {
  try {
    /* Check authentication — reject if not logged in */
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* Parse the request body */
    const body = await request.json()

    /* Validate required fields */
    if (!body.id || typeof body.read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    /* Update the inquiry's read status in the database */
    const inquiry = await prisma.inquiry.update({
      where: { id: body.id },
      data: { read: body.read },
    })

    return NextResponse.json(inquiry)
  } catch (error) {
    console.error('Failed to update inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 }
    )
  }
}
