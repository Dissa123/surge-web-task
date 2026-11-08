# NŌTA homepage rebuild: Next.js + Strapi on Railway

Rebuild of the homepage of https://nota.uprock.pro/ for the Surge Global Senior Web Developer assignment.
All homepage content (copy, images, links, price, navigation, SEO, popup and form copy, footer) lives in Strapi.

| Piece | Tech | Folder |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, plain CSS | [`web/`](web) |
| CMS | Strapi 5 (self-hosted), TypeScript | [`cms/`](cms) |
| Database | SQLite locally, Postgres on Railway | |
| Media | Strapi local upload provider on a Railway Volume | |

## Live deployment
- Site: https://web-production-7312b3.up.railway.app
- Strapi admin: https://cms-production-186a.up.railway.app/admin
- Railway project: Postgres + `cms` (volume at `/app/public/uploads`) + `web`, deployed from this repo.
- The site carries a `noindex` tag.

## Why Next.js
- **Server rendering**: the page is HTML on first byte (good for SEO and LCP). The reference is a content-heavy marketing page.
- **Tagged fetch cache + on-demand revalidation**: Strapi pings `/api/revalidate` on publish, so edits go live with no deploy and no rebuild (see below).
- **Route handlers** give a server-side proxy for the form, so the browser never talks to Strapi directly.
- Only the interactive pieces (header, popup, two carousels, reveal-on-scroll) are client components; everything else is server-rendered.

## Run locally
Requires Node 20+.

```bash
# 1. CMS
cd cms
cp .env.example .env          # then replace the placeholder secrets (APP_KEYS etc.)
npm install
npm run develop               # http://localhost:1337/admin  (create the first admin user)
# First boot seeds all homepage content + images and opens the public read/create permissions.

# 2. Frontend (second terminal)
cd web
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```
`REVALIDATE_SECRET` must be identical in `cms/.env` and `web/.env.local`.

## Content model (Strapi)
Editors work with components and repeatable items; there is no big rich-text field.

**Single type `Homepage`**
- `seo` (component `shared.seo`): meta title, description, OG image, `noIndex` (defaults to **true**, as the brief requires)
- `sections` (**dynamic zone**, reorderable, each can be added or removed):
  - `sections.hero`: eyebrow, title, scroll-cue label, pen image (fallback), repeatable callouts (label + text) that attach to the nib, grip and cap of the pen photo
  - `sections.specifications`: eyebrow, title, pen photo (vertical, nib up), repeatable `elements.spec-group` (title and repeatable text items), repeatable `elements.part-mark` (part: nib / grip / button / body / clip / cap, label, text) that become animated marks pinned to the pen photo
  - `sections.audience`: lede, label, intro, macro image, repeatable cards
  - `sections.feature-block`: eyebrow, title, subtitle, body, background image (+ optional second image). Reused for the sync, AI and paper scenes
  - `sections.works-with`: intro title, scene title, subtitle, body, repeatable slides (desktop and mobile image, alt text). Autoplays with a segmented progress bar
  - `sections.inside-box`: title, description, repeatable image tiles (label + image), set heading/intro, repeatable products (title, text, image), repeatable colour options (name, caption, swatch, image)
  - `sections.closing`: statement (footer navigation and year come from Site Setting)

**Single type `Site Setting`**: logo, site name (wordmark), repeatable nav links, order button label, product name and price, popup images (desktop, tablet, mobile), "Stay ahead" copy and all form messages (placeholder, button, success, error, validation), team credits, footer year, copyright and credit links.

**Collection `Subscriber`**: `email` (unique), `source`. Created by the form; the public role can only `create`.

Public API access is limited to `find` on the two singletons and `create` on subscribers (granted in `cms/src/seed/index.ts`). A custom controller always returns the fully populated page, so the frontend needs no populate query.

## How "publish in Strapi → live site" works
1. An editor clicks Publish.
2. A Strapi document-service middleware ([`cms/src/index.ts`](cms/src/index.ts)) calls `POST {FRONTEND_URL}/api/revalidate` with a shared secret.
3. Next.js runs `revalidateTag("strapi")`; the next request re-fetches from Strapi. No code deploy.
4. Safety net: the data cache also expires after 1 hour in case a ping is missed.

## Form
"Stay ahead" popup (opened by **Order**): client validation (required, email format, messages editable in Strapi) → `POST /api/subscribe` (server validation, honeypot field, 5/min/IP limiter) → Strapi `subscribers`. Duplicate emails are treated as success. Loading, success and error states match the reference copy.

## Railway deployment
Three services in one project, plus a volume:

| Service | Root dir | Notes |
|---|---|---|
| `postgres` | Railway Postgres plugin | Strapi database |
| `cms` | `cms` | Strapi. Volume mounted at `/app/public/uploads` so **uploaded media survives redeploys** |
| `web` | `web` | Next.js |

**cms variables**
```
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=false            # private network
APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, TRANSFER_TOKEN_SALT, JWT_SECRET, ENCRYPTION_KEY  (random)
PUBLIC_URL=https://<cms-domain>.up.railway.app
IS_PROXIED=true
NODE_ENV=production
FRONTEND_URL=https://<web-domain>.up.railway.app
REVALIDATE_SECRET=<shared secret>
CORS_ORIGINS=https://<web-domain>.up.railway.app
```
**web variables**
```
STRAPI_URL=http://${{cms.RAILWAY_PRIVATE_DOMAIN}}:1337     # server-to-server over private networking
NEXT_PUBLIC_STRAPI_URL=https://<cms-domain>.up.railway.app # image URLs the browser loads
NEXT_PUBLIC_SITE_URL=https://<web-domain>.up.railway.app
REVALIDATE_SECRET=<same shared secret>
```
Notes:
- Only `web` and the Strapi admin need public domains; Next.js reaches Strapi privately.
- Seeding runs once at first boot (only if the singletons are empty). Set `SEED_ON_BOOT=false` afterwards if desired.
- Create the reviewers' admin accounts in Strapi → Settings → Administration panel → Users.

## Design notes
Compared against the live reference with Playwright screenshots at 1440 / 768 / 390 px. Hero (grey scene, pen rotated 90° and sliding on scroll via a CSS variable), serif headings (Instrument Serif), white and dark section rhythm, frosted-glass cards, rounded image tiles with pills, split-caption colour carousel and the white "Order Nota One • $300" bar are recreated from scratch.
The reference also plays two scroll-scrubbed MP4s; I did **not** reuse them (the brief only allows the reference's images), so those moments are approximated with CSS/JS motion on the still images.

## Animated spec cards
[`SpecGroups.tsx`](web/src/components/sections/SpecGroups.tsx): the Strapi spec groups render as numbered cards with icons. Rows reveal in a stagger with drawn dividers on scroll, the cursor drives a spotlight and a rotating conic-gradient border on hover, and below 1024px the cards become an accessible accordion. Respects `prefers-reduced-motion`.

## 3D and motion layer
The hero pen is a live, procedurally modelled three.js object; the other product shots stay the real CMS photographs, with three.js adding depth and light on top of them:
- [`PhotoSheen.tsx`](web/src/components/PhotoSheen.tsx): renders the CMS photo on a plane in a **perspective** three.js scene. A fragment shader adds a travelling specular glint (highlights only), a cursor-following soft light and micro-parallax; the plane sways in depth, swings in on load and tilts toward the cursor. The plain `<img>` is the SEO / first-paint / no-WebGL / CORS fallback.
- [`DustField.tsx`](web/src/components/DustField.tsx): bokeh dust in true 3D. Points sit in front of and behind the photo, blur in proportion to distance from the focal plane, and the camera drifts with the cursor so layers parallax against each other.
- [`Hero.tsx`](web/src/components/sections/Hero.tsx) + [`PenScene.tsx`](web/src/components/sections/PenScene.tsx) + [`pen3d.ts`](web/src/lib/pen3d.ts): PBR-metal pen (fluted cap, clip, graphite grip, button, shouldered nib) with studio lighting. It flies in on load, spins around its own axis as you scroll, tilts toward the cursor, and its screen-space anchor points drive the editable callouts. The CMS pen image is the first-paint / no-WebGL fallback.
- [`SpecsStage.tsx`](web/src/components/sections/SpecsStage.tsx): editable part marks (pulse ring, drawn leader line, label card) pinned to the real pen photo; the photo uses `mix-blend-mode: multiply` so its white background disappears into the page.
- [`AudienceStage.tsx`](web/src/components/sections/AudienceStage.tsx): "Who it's for" uses the same 3D pen in a bright white studio. It flies in when the section is reached, then rolls slowly around its own axis, floats, tilts toward the cursor and drifts with scroll, over a soft breathing contact shadow. The CMS photo is the no-WebGL fallback. [`ScrollLede.tsx`](web/src/components/ScrollLede.tsx) lights the lede word by word on scroll.
- [`DepthScene.tsx`](web/src/components/sections/DepthScene.tsx): the "synced to your phone" scene (CMS toggle: Feature block → *Depth scene*). The photo sits on a perspective plane and uses its own blurred luminance as a pseudo depth map, so the bright phone parallaxes against the dark set as the camera drifts with the cursor. Glowing sync streams (comets with trails) arc through real 3D space from the notebook side into the phone, pulse rings mark each arrival, and a glint sweeps the highlights. Stream endpoints are tuned to the seeded photograph; the static image is the fallback.
- [`BookScene.tsx`](web/src/components/sections/BookScene.tsx): the "No delays. No glitches." scene (CMS: Feature block → *Book scene* + *Cover image*). The section is pinned and scroll scrubs a timeline: a closed notebook floats at a three-quarter angle, the cover swings open on its spine while the book straightens to a top-down view, and the open spread holds. Cover and pages are crops of the two CMS photographs used as textures (crop rectangles are tuned to the seeded photos), so the brand imagery is never replaced by generated art.
- [`PaperScene.tsx`](web/src/components/sections/PaperScene.tsx): the "Looks like paper. Works like a system." scene (CMS: *Paper scene* + *Paper image*). A real page cropped from the notebook photograph is lit and curled in 3D with a soft shadow. Scroll tilts it into space, a scan of light travels down the page, red recognition boxes lock onto the real handwriting line by line, and the nearly invisible dot map shimmers in behind the scan. The CMS photo stays as the dimmed backdrop; the crop and box coordinates are tuned to the seeded photograph.
- [`PatternScene.tsx`](web/src/components/sections/PatternScene.tsx): the "We use special paper with a nearly invisible pattern" carousel. The CMS slides become sheets floating in 3D (active one forward, neighbours angled back in depth) and follow the carousel (autoplay, swipe, arrows, progress bar). A red scan sweeps down the active sheet and reveals its near-invisible dot lattice, while a coordinate lattice behind ripples from the pointer. The DOM slides remain as the fallback.
- [`SmoothScroll.tsx`](web/src/components/SmoothScroll.tsx): Lenis inertial scrolling (handles #anchors); magnetic Order button.
All of it loads three.js lazily (only near the viewport), pauses off-screen, and respects `prefers-reduced-motion`. WebGL texture loading needs the CMS to send CORS headers for the frontend origin (`CORS_ORIGINS`); if it doesn't, the static image simply stays.

## Key trade-offs
- **Local upload provider + Railway Volume** instead of S3/Cloudinary: simplest and keeps everything inside Railway, but ties the CMS to a single replica. An S3-compatible bucket is the better scaling path.
- **`<img>` + Strapi's generated formats** instead of `next/image`: avoids a second image-processing hop and private-network image fetching issues; no AVIF/WebP negotiation.
- **Plain CSS** with a small token set instead of a UI library, to keep the bundle small and the styling transparent.
- **In-memory rate limiter** for the form: fine for one instance, not horizontally scalable.
- **Seed content in code** (`cms/src/seed`) makes the project reproducible from an empty database; after first boot Strapi is the source of truth.

## What I'd improve with more time
- Further pixel-level tuning. Fonts, structure and layout follow the reference, but exact spacing, colours and the scroll-scrubbed video transitions (hero, striped "Inside the box" reveal) are approximations.
- Playwright visual-regression and e2e tests (form, carousels, popup) in CI; Strapi content-type tests.
- Strapi Preview and draft mode wired to Next.js Draft Mode, so editors see unpublished changes.
- Proper `Form` and `Order` flow if the product launches (checkout rather than a waitlist).
- Cloud media provider, Redis rate-limit, error monitoring.
- i18n: the reference form carries Russian validation strings.

## AI tools used
- **Claude Code** (Anthropic): scaffolding, the three.js pen scene,, drafting the Strapi content model and seed script, Next.js components and CSS, README. I reviewed and tested the output (typecheck, production builds, Playwright checks of the form, popup, carousels and responsive overflow at 1440, 1024, 768 and 390 px).
- No site-cloning or export tools were used. HTML, CSS and JS are written from scratch; only the reference's images and copy are reused, as the brief allows.

## Notices
The design belongs to its original creators. The site is marked `noindex` (via Strapi SEO component) and should be taken down once the review round closes.
