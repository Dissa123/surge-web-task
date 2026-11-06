# Submission kit (not part of the app)

## 1. Deploy checklist
- [ ] GitHub repo created, `git push -u origin main`, shared with kavinda.kobbekaduwe@surge.global, kavisha@surge.global, samith@surge.global
- [ ] Railway project: Postgres + `cms` (root `cms`, volume `/app/public/uploads`) + `web` (root `web`)
- [ ] Variables set as in README (DATABASE_URL, PUBLIC_URL, IS_PROXIED, FRONTEND_URL, CORS_ORIGINS, REVALIDATE_SECRET, STRAPI_URL, NEXT_PUBLIC_STRAPI_URL, NEXT_PUBLIC_SITE_URL)
- [ ] First boot with SEED_ON_BOOT=true, then set false
- [ ] Admin created + 3 reviewer admins created
- [ ] Publish test: edit in Strapi -> live site updates, no deploy
- [ ] Form test: submit on live site -> entry in Strapi "Subscribers"
- [ ] Redeploy test: uploaded images survive
- [ ] noindex present (view source)

## 2. Recording script (under 10 min)
1. (0:00) Goal: Strapi CMS + Next.js frontend on Railway, 3 services.
2. (0:45) Railway canvas: Postgres, cms, web. Explain each.
3. (2:00) Postgres: Strapi's database, connected via DATABASE_URL reference.
4. (3:00) cms: Variables (PUBLIC_URL, IS_PROXIED, CORS_ORIGINS, FRONTEND_URL, REVALIDATE_SECRET). Volume at /app/public/uploads = media survives redeploys.
5. (4:30) web: Variables (STRAPI_URL, NEXT_PUBLIC_*), reads Strapi at request time with tagged fetch cache.
6. (5:30) Networking: public domains; web -> cms over HTTPS; CORS for 3D textures.
7. (6:30) Live demo: change a headline in Strapi, publish; Strapi pings /api/revalidate, site updates in ~1s.
8. (8:00) Form: submit on the site, show entry in Subscribers.
9. (8:45) Redeploy cms, show images still load. Wrap up.

## 3. Email draft
Subject: Homepage rebuild submission – <Your name>

Hi Kavinda, Kavisha and Samith,

Please find my submission for the Senior Web Developer assignment:

- Live site: <URL>
- Strapi admin: <URL>/admin (logins for your three emails sent separately / below)
- GitHub repo: <URL> (shared with all three of you)
- Railway walkthrough (<10 min): <URL>
- README: in the repo root (framework choice, local run, content model, trade-offs, improvements, AI tools)

The site carries a noindex tag and will stay live until you close the round.

Kind regards,
Nethma
