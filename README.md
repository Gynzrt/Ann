# halo

A link-in-bio platform: claim a username, design a profile page with layouts, effects and music, and share `yoursite.com/username`.

Built with React, TypeScript, Tailwind CSS, Framer Motion, Lucide and Supabase.

## Features

- **Accounts:** sign up, log in, change email or password, delete your account
- **Public profiles at `/username`:** avatar, banner, display name, description, location, badges, view counter, social links, click-to-enter screen
- **Five layouts, each built differently:**
  - Default: one centred card
  - Modern: banner header with an overlapping avatar
  - Simplistic: no card
  - Sleek: wide card with links as rows
  - Portfolio: two columns with labelled sections
- **Customization:**
  - Accent, background, text, icon and border colours
  - Six fonts
  - Card opacity, blur, corner radius and border
  - Glow on the username, icons and badges
  - Entrance animations and 3D tilt
  - Custom browser tab title
- **Effects:**
  - Backgrounds: particles, snow, rain, twinkling stars, shooting stars, floating orbs, or your own image or video
  - Username effects: glow, rainbow, shimmer, sparkles, typewriter
  - A typewriter description
  - Cursors: dot, ring, trail, or your own image
- **Music:** a playlist of up to 10 uploaded tracks with covers, seek, skip, shuffle and volume. It starts from the enter screen, because browsers block autoplay with sound.
- **Discord presence:** live status, game or Spotify track through the public [Lanyard](https://github.com/Phineas/lanyard) API. You need to join Lanyard's Discord server.
- **Links:** over 35 platforms. Handles become full URLs, and wallet addresses and Discord usernames copy to the clipboard. Drag to reorder.
- **Dashboard:**
  - Overview: total views, a 14-day views chart and a setup checklist
  - A customizer with a live desktop or phone preview
  - Links and account settings
- **Templates** you can apply in one click. They change the style and keep your content.
- **Leaderboard** of the most viewed profiles
- **View tracking:** one view per visitor per day

## Run it

```bash
npm install
npm run dev
```

### Two modes

- **Local mode (default).** With no Supabase keys, everything works, but accounts, profiles, uploads and views are stored in your browser's IndexedDB. That's good for trying it out, but nobody else can see your page. The app shows a notice whenever it's in local mode.
- **Supabase mode.** To make it real:
  1. Create a Supabase project.
  2. Run `supabase/migrations/0001_init.sql`, either in the SQL editor or with `supabase db push`. It creates the tables, row-level security policies, the `record_view` function and a public `media` storage bucket.
  3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Users can't edit their own view count, UID, premium status or system badges. A database trigger enforces this.

## Deploy

```bash
npm run build
```

This outputs `dist/`. Routes like `/username` need a fallback to `index.html`. `public/_redirects` handles this on Netlify and `vercel.json` handles it on Vercel.

## Not included

- **Payments.** The Premium plan is shown on the pricing page, but its button is disabled. No feature is locked behind it.
- **Custom domains.**

## Layout

| Path | What it does |
| --- | --- |
| `src/lib/backend/` | The `Backend` interface, with Supabase and local implementations |
| `src/lib/types.ts` | Profile and appearance model, with defaults |
| `src/components/profile/` | Public profile renderer, layouts, effects, player, Discord card |
| `src/pages/` | Marketing pages, auth, public profile |
| `src/pages/dashboard/` | Overview, Customize, Links, Settings |
| `supabase/migrations/` | Database schema |
