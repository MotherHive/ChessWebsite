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

## Cloudflare Workers

The site runs on Cloudflare Workers through OpenNext:

```bash
npm run preview
npm run deploy
```

`wrangler.jsonc` binds the Worker to:

- `DB`: the `chess-website-db` D1 database
- `TOURNAMENT_IMAGES`: the `chess-website-tournament-images` R2 bucket
- `PUBLIC_FORM_RATE_LIMITER`: five submissions per form, per IP, per 10 seconds

Create or update the database schema with:

```bash
npx wrangler d1 migrations apply chess-website-db --local
npx wrangler d1 migrations apply chess-website-db --remote
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
Cloudflare bindings, D1 helpers, Access verification, Stripe, email, and HTTP
infrastructure live in `src/shared/server`. Browser code must not import either
server directory.

## Tournament Payments

Stripe tournament checkout uses Next.js route handlers on Cloudflare Workers and
stores registration state in D1.

Required environment variables:

```text
ADMIN_EMAILS=admin@example.com
CLOUDFLARE_ACCESS_TEAM_DOMAIN=https://your-team.cloudflareaccess.com
CLOUDFLARE_ACCESS_AUD=access-application-audience-tag
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_ALLOW_LIVE=false
RESEND_API_KEY
RESEND_FROM=Scranton Chess Club <noreply@scrantonchess.org>
SITE_URL=https://scrantonchess.org
```

Configure the Stripe webhook endpoint at `/api/stripe-webhook` and enable the
`checkout.session.completed` and `checkout.session.expired` events.
Stripe sandbox keys (`sk_test_` or `rk_test_`) are accepted by default. Live
keys are rejected unless `STRIPE_ALLOW_LIVE=true` is deliberately configured.

`TURNSTILE_SECRET_KEY` may be omitted only during development on `localhost`.
Deployed club signup and tournament registration endpoints fail closed when the
secret is absent. Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the build
environment and `TURNSTILE_SECRET_KEY` as a Worker secret before deploying.

The Worker-level rate limiter protects `/api/club-signups` and
`/api/tournament-registration`, including on a temporary `workers.dev` domain.
After the production domain is an active Cloudflare DNS zone, add a WAF
rate-limiting rule over the same two paths as an extra layer. R2 image reads are
placed in Cloudflare's edge cache for one year, while R2 writes remain behind the
admin Access policy. Cloudflare budget notifications are alerts rather than hard
spending caps, so keep a low billing alert enabled as an additional warning.

## Admin Access

Create one Cloudflare Access self-hosted application covering `/admin` and
`/api/admin`, with an Allow policy for the addresses in `ADMIN_EMAILS`. Put its
team domain and audience tag in the variables above. The API verifies Access's
signed JWT in addition to the edge policy.

For local development only, `.dev.vars` can contain:

```text
ADMIN_AUTH_BYPASS=true
LOCAL_ADMIN_EMAIL=admin@example.com
```

The bypass is accepted only on `localhost` or `127.0.0.1`.

## Supabase Data Import

During the migration window, an existing Supabase database can be exported to a
private D1-compatible SQL file and imported with:

```bash
node scripts/export-supabase-for-d1.mjs .env.local /tmp/chess-website-supabase-import.sql
npx wrangler d1 execute chess-website-db --remote \
  --file /tmp/chess-website-supabase-import.sql
```

The export file can contain registration personal data, is created with mode
`0600`, and must not be committed. Supabase Storage objects require a separate
copy into R2.
