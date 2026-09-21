# Cali Journal — v1

A single-user weekly journal for tracking calisthenics certification progress:
notes, metrics (reps/holds/progressions), photos, tags (what you learned), and
homework for next week.

## Stack
- Next.js (App Router) + Tailwind
- Supabase: Postgres (data), Storage (photos), Auth (magic link)
- Deploy target: Vercel

## Setup

### 1. Create a Supabase project
Go to https://supabase.com, create a new project, and grab your project URL
and anon key from Settings → API.

### 2. Run the schema
Open the SQL editor in your Supabase project and run the contents of
`supabase/schema.sql`. This creates all tables, RLS policies, and the
photo storage bucket.

### 3. Configure email auth
Supabase Auth → Providers → Email is on by default. For magic links to work
locally, go to Auth → URL Configuration and add `http://localhost:3000/auth/callback`
as a redirect URL. Add your production URL there too once deployed.

### 4. Environment variables
Copy `.env.local.example` to `.env.local` and fill in your project URL/key:

```
cp .env.local.example .env.local
```

### 5. Run locally

```
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to /login. Enter your
email, check your inbox for the magic link.

### 6. Deploy to Vercel
- Push this repo to GitHub.
- Import it in Vercel.
- Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
  in Vercel project settings.
- Add your Vercel production URL + `/auth/callback` to Supabase's redirect URLs.
- Deploy.

### 7. Install as an app on your phone
Once deployed, open the URL on your phone in Safari/Chrome and use
"Add to Home Screen" — it's a PWA (see `app/manifest.ts`), so it opens
full-screen like a native app. No app store needed, one codebase for
web and phone.

## Data model
See `supabase/schema.sql`. Core entity is `entries` (one per week), with
`metrics`, `photos`, `tags`, and `homework` hanging off it via `entry_id`.
`tags` is deliberately just free-text labels — this is meant to share
vocabulary with a future micro-learning/lessons feature without needing
a schema change now.

## What's deliberately NOT built yet
- Micro-learning/lessons (planned next phase — `tags` is the intended bridge)
- Public sharing / multi-user (RLS is already scoped to `user_id`, so this
  is a permissions change later, not a rewrite)
- Charts over metrics history (data model supports it; no UI yet)
