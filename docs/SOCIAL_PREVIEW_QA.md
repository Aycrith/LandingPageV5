# Social Preview QA Runbook

- **Project**: LandingPageV5
- **Scope**: Open Graph and Twitter/X preview verification
- **Primary implementation**: route-based generated images
  - `src/app/opengraph-image.tsx`
  - `src/app/twitter-image.tsx`
- **Optional override**: `public/social/og-image-1200x630.png`

## Pre-checks

1. Confirm metadata config in `src/app/layout.tsx`:
   - `metadataBase` is set from `NEXT_PUBLIC_SITE_URL`
   - `openGraph.images` includes `/opengraph-image`
   - `twitter.images` includes `/twitter-image`
2. Confirm environment value:
   - `NEXT_PUBLIC_SITE_URL` points to the active environment domain

## Local QA

1. Start app locally.
2. Visit image routes:
   - `http://localhost:3000/opengraph-image`
   - `http://localhost:3000/twitter-image`
3. Expected result:
   - Both return a 1200×630 image card.
4. Open homepage (`http://localhost:3000`) and inspect metadata.
5. Expected metadata tags:
   - `og:image` resolves to `/opengraph-image`
   - `twitter:image` resolves to `/twitter-image`

## Staging QA

Use your staging domain in place of `<staging-domain>`.

1. Open:
   - `https://<staging-domain>/opengraph-image`
   - `https://<staging-domain>/twitter-image`
2. Confirm both are reachable and return image content.
3. Load homepage and inspect final rendered metadata.
4. Validate in external preview tools:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - X Card Validator (if available): https://cards-dev.twitter.com/validator
5. Re-scrape/crawl URL in each tool after deployment updates.

## Production QA

Use your production domain in place of `<prod-domain>`.

1. Open:
   - `https://<prod-domain>/opengraph-image`
   - `https://<prod-domain>/twitter-image`
2. Confirm metadata tags on homepage are correct and absolute URL composition is valid.
3. Re-run external preview validators.
4. Verify card image, title, and description all match current launch messaging.

## If using static override

If a finalized static image is used:

1. Place file at `public/social/og-image-1200x630.png`.
2. Update metadata image URLs in `src/app/layout.tsx` accordingly.
3. Validate file-size constraints:
   - Open Graph image ≤ 8MB
   - Twitter image ≤ 5MB
4. Re-run local, staging, and production checks.

## Troubleshooting

- **Wrong image shown in social cards**
  - Cause: scraper cache.
  - Fix: re-scrape URL in platform debugger.

- **Relative URL appears in metadata**
  - Cause: missing/incorrect `NEXT_PUBLIC_SITE_URL`.
  - Fix: set correct domain and redeploy.

- **Image route returns non-image response**
  - Cause: runtime/config regression in `opengraph-image.tsx`.
  - Fix: verify `ImageResponse` export and route accessibility.

## QA Sign-off checklist

- [ ] Local preview routes render correctly.
- [ ] Staging preview routes render correctly.
- [ ] Production preview routes render correctly.
- [ ] `og:image` and `twitter:image` tags are correct.
- [ ] External validator checks completed.
- [ ] Cache refresh/re-scrape completed after latest deploy.
