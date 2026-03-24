This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Social Preview Verification

This project uses generated metadata image routes:

- Open Graph: `/opengraph-image`
- Twitter: `/twitter-image`

Detailed runbook: `docs/SOCIAL_PREVIEW_QA.md`

### Local checks

1. Ensure `.env` contains:
	- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
2. Start the app and open:
	- `http://localhost:3000/opengraph-image`
	- `http://localhost:3000/twitter-image`
3. Confirm both routes return a rendered image card (1200×630).
4. Open the homepage and inspect page source/metadata to verify:
	- `og:image` points to `/opengraph-image`
	- `twitter:image` points to `/twitter-image`

### Optional static override

If design provides a finalized static social card, place it at:

- `public/social/og-image-1200x630.png`

Then update metadata image URLs in `src/app/layout.tsx` to this static path if desired.

### Release checklist

- Production `NEXT_PUBLIC_SITE_URL` is set to the final domain.
- Social image endpoints are reachable on deployed URL.
- If static override is used, keep image sizes within platform limits:
  - Open Graph image ≤ 8MB
  - Twitter image ≤ 5MB

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
