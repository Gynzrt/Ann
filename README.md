# halo

A bio-link page builder that needs no server. Design your page in the editor, click **Copy share link**, and put that link in your bio.

The whole page is compressed into the link's `#p=` part, so nothing is stored anywhere except your editor draft, which stays in your own browser.

## Features

**Profile**
- Avatar, display name, multi-line bio and location
- Up to 6 badges (developer, gamer, artist, night owl, and more)
- Live Discord status, custom status and current game or Spotify track, through the free [Lanyard](https://github.com/Phineas/lanyard) API. You can also use your Discord avatar.

**Links**
- Up to 12 links. Paste `github.com/you` or `you@mail.com` and it becomes a proper link.
- Known sites (Discord, YouTube, Twitch, Spotify and about 30 more) get their name and colour automatically
- Optional site icons, loaded from each site
- "Copy" items copy text such as a username instead of opening a page
- List, grid or icons-only layout, with lift, glow, shine or slide hover effects

**Look**
- 8 one-click themes: Midnight, Sakura, Terminal, Vapor, Ember, Frost, Candy and Mono
- Gradient (optionally animated), aurora, image or video backgrounds, with dim, blur and mouse parallax
- Vignette, film grain and scanline overlays
- Glass, solid, outline or no card. Sans, rounded, mono or serif fonts.
- Circle, rounded or square avatar with a solid, spinning or pulsing ring

**Effects**
- Name: glow, rainbow, shimmer, neon flicker, glitch or wave
- Bio: typewriter, or rotate through lines one at a time
- Particles: dust, stars (with shooting stars), snow, fireflies, rain, bubbles, hearts, petals, confetti, network or code rain. You can set the amount and make them react to the mouse.
- Cursor: glow trail, sparkles or a custom ring. Click: burst or ripple.
- Card entrance animation (fade, zoom, blur, drop) and 3D tilt
- Animated browser tab title

**Music**
- Background music with a play/pause and volume player
- Audio visualizer around the avatar (the audio host must allow CORS)
- "Click to enter" screen with your own text. Browsers only play sound after a click.

**Editor**
- Live preview in desktop or phone size, with a Replay button for the enter screen and animations
- Export and import your page as JSON, or paste a share link to keep editing a page
- Respects the system "reduce motion" setting. All effects switch off for those visitors.

## Run locally

The app uses ES modules, so it needs a web server; opening `index.html` as a file won't work.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Any static host works too, such as GitHub Pages, Netlify or Cloudflare Pages.

## How it fits together

| File | What it does |
| --- | --- |
| `js/main.js` | Shows a shared page if the URL has `#p=`, otherwise opens the editor |
| `js/schema.js` | Fields, defaults, themes, validation and upgrading old links |
| `js/codec.js` | Turns a profile into the `#p=` link and back |
| `js/render.js` | Builds the page from a profile |
| `js/editor.js` | Editor form, preview, share, import and export |
| `js/fx/` | Particles, cursor and click effects, text effects |
| `js/music.js`, `js/discord.js` | Music player and visualizer, Discord presence |

Links only store settings that differ from the defaults in `schema.js`, which keeps them short. **Never change an existing default.** That would change pages people have already shared. New settings are fine as long as their default means "off". Links made with the first version of halo still open correctly.

## Security

Anyone can make a profile link, so the page treats every value as untrusted. Text is always inserted as plain text. Links must be `http(s)` or `mailto`, and images, video and audio must be `http(s)`. Anything else is dropped.

## Not included (these need a backend)

Short usernames (`/yourname`), view counters, accounts and file uploads.
