# BuildConnect

**Trabaho. Koneksyon. Pag-asa.**

BuildConnect is a mobile-first job marketplace connecting Filipino clients with local construction and home-repair workers.

## MVP features
- Client and worker accounts (Supabase Auth)
- Job posts with required region, province, city/municipality and barangay
- Public job listings show only the general work area
- Workers can submit price, estimated days and a proposal
- Clients can review proposals and approve a worker
- Filipino / English interface

## Stack
- React + TypeScript + Vite
- Supabase Auth, Postgres, Storage and Realtime
- GitHub Pages deployment

## Local development
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the existing BuildConnect Supabase project URL and **publishable** key.
5. Run `npm run dev`.

Never put a Supabase service-role or secret key in frontend code or GitHub Actions variables.

## Deployment
The GitHub Actions workflow builds the Vite app and publishes `dist/` to GitHub Pages. Add repository Actions variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then enable GitHub Pages with **GitHub Actions** as the build and deployment source.

## Supabase schema
The frontend targets the existing BuildConnect schema: `profiles`, `job_categories`, `job_posts`, `bids`, and related tables. Row Level Security must remain enabled.
