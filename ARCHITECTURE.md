# Özgül's Realty — Architecture Diagram

## System Overview

```
Browser
  |
  v
Vercel (Hosting + CDN + Edge Network)
  |
  v
Next.js 16 App Router + Turbopack
  |
  |-- proxy.ts  (Combined Middleware)
  |     |-- NextAuth: protect /nmo-bbo-141522/* routes
  |     +-- next-intl: locale routing for all public routes
  |
  |-- app/[locale]/  (Public Site — Server + Client Components)
  |     |-- layout.tsx --> Cormorant font + NextIntlClientProvider + Navbar + SmoothScroll + CookieBanner
  |     |-- page.tsx (Homepage: Hero, Properties, Agent, Contact)
  |     |-- properties/ (Listing with URL filters + Detail with gallery)
  |     |-- about/ (Agent profile, multilingual bio)
  |     +-- privacy/ + cookies/ (Legal pages, 4 languages)
  |
  |-- app/[locale]/nmo-bbo-141522/  (Admin Panel — Turkish UI)
  |     |-- layout.tsx (adminWrapper class, no Navbar)
  |     |-- page.tsx --> AdminDashboard (4 tabs, separate pagination)
  |     |-- login/ (Login form)
  |     |-- properties/ (Add/Edit property form)
  |     +-- agent/ (Edit agent profile)
  |
  |-- app/api/  (API Routes)
  |     |-- auth/[...nextauth] (NextAuth handler)
  |     |-- properties/ (GET public / POST+PUT+DELETE auth)
  |     |-- agent/[id] (PUT auth)
  |     |-- contact/ (POST: rate limit + validate + DB + email)
  |     +-- upload/ (POST: auth + type check + 5MB + Cloudinary)
  |
  +-- app/components/  (Shared Components)
        |-- Navbar, HeroImage, ImageGallery
        |-- ContactForm, PropertiesFilter, PropertyImage
        |-- AnimatedSection (GSAP), FadeIn (Framer), SmoothScroll (Lenis)
        |-- CookieBanner (GDPR/KVKK)
        +-- admin/ (AdminDashboard, PropertyForm, AgentForm, ImageUpload)
```

## External Services

| Service | Purpose | Used In |
|---------|---------|---------|
| Neon (PostgreSQL) | Database — Properties, Inquiries, Agents, Admins | All server components + API routes via Prisma |
| Cloudinary | Image storage + CDN delivery + optimization | HeroImage, PropertyImage, ImageGallery, ImageUpload API |
| Resend | Email notifications on contact form submission | app/api/contact/route.ts |
| NextAuth.js v5 | Admin authentication — Credentials only | auth.ts, proxy.ts, admin pages + mutating APIs |
| Vercel | Hosting, CDN, serverless functions, auto-deploy | Production deployment |
| GitHub | Source control, triggers Vercel auto-deploys | main branch → auto-deploy |

## Data Flow

```
Public Visitor:
  Browser → Vercel CDN → Next.js SSR → Prisma → Neon PostgreSQL
  Browser → Cloudinary CDN (images via CldImage)
  Browser → POST /api/contact → Rate Limit → Validate → Prisma → Resend Email

Admin User:
  Browser → proxy.ts (auth check) → Admin Pages
  Browser → POST /api/upload → Auth → Validate → Cloudinary
  Browser → POST/PUT/DELETE /api/properties → Auth → Prisma → Neon
  Browser → PUT /api/agent/[id] → Auth → Prisma → Neon
```

## Database Schema (4 Models)

```
Property: id, title, description[TR/RU/AR], price, location,
          bedrooms, bathrooms, area, imageIds[], videoId?,
          featured, forSale, createdAt, updatedAt

Agent:    id, name, title, bio[TR/RU/AR], phone, email,
          imageId, experience, listings, rating

Inquiry:  id, name, email, phone?, message, property?,
          createdAt, read

Admin:    id, name, email (unique), password (bcrypt),
          image?, role, createdAt
```

## Security Layers

```
Layer 1: proxy.ts middleware → Redirects unauthenticated admin requests
Layer 2: Each admin page.tsx → Checks auth() independently
Layer 3: Each mutating API → Checks auth() before processing
```

## Internationalization

```
4 Locales: EN (default), TR, RU, AR (RTL)

UI Strings:  messages/*.json → next-intl
DB Content:  Separate fields (descriptionTr, bioRu, etc.) → fallback to English
```
