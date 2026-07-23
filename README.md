# Chess Website

Next.js App Router site for the Scranton Chess Club.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vercel

Vercel can use the repository root with:

```text
Framework Preset: Next.js
Build Command: npm run build
```

## Architecture

The project uses a feature-first structure with a thin Next.js routing layer:

```text
app/                  URL routes and API entry points
src/tournaments/      tournament UI, registration rules, admin tools, and server workflows
src/home/             home page implementation
src/contact/          contact page implementation
src/shared/           site-wide components and external-service infrastructure
```

Files in `app` should stay small: they define a URL and hand work to the relevant
feature. Tournament code belongs in `src/tournaments`; code should move into
`src/shared` only when multiple features genuinely use it. The `@/` import alias
points to `src/`.

Tournament server code lives beside the feature in `src/tournaments/server`.
Supabase, Stripe, email, HTTP, and admin-authentication infrastructure lives in
`src/shared/server`. Browser code must not import either server directory.

## Tournament Payments

Stripe tournament checkout uses Vercel API functions and Supabase.

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS=admin@example.com
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_KEY
RESEND_FROM=Scranton Chess Club <noreply@scrantonchess.org>
SITE_URL=https://scrantonchess.org
```

Configure the Stripe webhook endpoint at `/api/stripe-webhook` and enable the
`checkout.session.completed` and `checkout.session.expired` events. Apply the Supabase migration in
`supabase/migrations` before enabling checkout in production.
