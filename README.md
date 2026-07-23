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

Routes and layouts live in `app`. Reusable feature implementations live in
`src/features`, shared UI in `src/components`, and server-only integrations in
`server`.

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
