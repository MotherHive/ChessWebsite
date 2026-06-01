# Chess Website

Vite React site for the chess website.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build is written to `dist`.

## Vercel

The app now lives at the repository root. Vercel can use the default root directory with:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

## Tournament Payments

Stripe tournament checkout uses Vercel API functions and Supabase.

Required environment variables:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SITE_URL=https://scrantonchess.org
```

Configure the Stripe webhook endpoint at `/api/stripe-webhook` and enable the
`checkout.session.completed` and `checkout.session.expired` events. Apply the Supabase migration in
`supabase/migrations` before enabling checkout in production.
