# halo

A bio-link profile page builder that needs no server. Fill in the editor, click **Copy share link**, and put that link in your bio.

The whole profile (name, avatar, bio, links, background, effects, music) is compressed into the link's `#p=` hash. Nothing is stored anywhere else, apart from your editor draft in your own browser's localStorage.

## Features
- Avatar, display name, bio, location, up to 12 links
- Gradient, image or video backgrounds, with dim and blur
- Accent color, glass, solid or no card, and a choice of font
- Effects: typewriter bio, glowing name, 3D tilt card, and dust, snow or star particles
- Background music, with a "click to enter" screen (browsers only play audio after a click)
- Works on phones and respects reduced-motion settings

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. Any static host works, such as GitHub Pages, Netlify or Cloudflare Pages.

## Security
Profiles come from links anyone can make, so all text is inserted as plain text. Links must be `http(s)` or `mailto`, and media must be `http(s)`. Anything else is dropped.

## Not included (needs a backend)
Short usernames (`/yourname`), view counters, accounts, file uploads and live Discord presence.
