# Peak Hair Restoration — Website

Static single-page site. No build step, no dependencies, no server-side code.

## Structure

```
peakhair-website/
├── public/                    ← Vercel serves this folder as the site root
│   ├── index.html             the whole page (HTML + CSS + JS inlined)
│   ├── robots.txt
│   └── assets/
│       ├── peak-logo-2x.png       logo (transparent PNG)
│       ├── peak-hero-web.mp4      hero background video
│       ├── peak-hero-poster.jpg   poster frame shown before the video loads
│       └── peak-ba-1…5.jpg        patient before/after photos (carousel)
├── vercel.json                 tells Vercel the output dir is public/
└── .gitignore
```

## Deploy — GitHub + Vercel

1. **Push to GitHub**
   ```
   git init            # already done if you're reading this from the repo
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/peakhair-website.git
   git push -u origin main
   ```

2. **Import into Vercel**
   - Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
   - Framework preset: **Other** (no build command needed — `vercel.json`
     already points Vercel at `public/`).
   - Deploy. Every push to `main` auto-deploys; PRs get preview URLs.

   Or from the CLI, run from this folder:
   ```
   vercel login
   vercel        # first deploy, links the project
   vercel --prod # promote to production
   ```

3. **Point your GoDaddy domain at Vercel**
   In Vercel: Project → Settings → Domains → add your domain (e.g.
   `peakhairtransplant.com`). Vercel will show the exact records to add —
   normally:
   - Apex domain (`peakhairtransplant.com`): an **A** record → `76.76.21.21`
   - `www` subdomain: a **CNAME** record → `cname.vercel-dns.com`

   In GoDaddy: **My Products → DNS → Manage Zones** for the domain, edit or
   add those records to match exactly what Vercel shows you (Vercel
   sometimes issues different values per account — always copy the values
   from your own Vercel dashboard rather than assuming the ones above).
   DNS propagation can take anywhere from a few minutes to ~48 hours.

## If images or video appear broken

Confirm `public/assets/` was pushed to GitHub (check the repo on
github.com) and that Vercel's build output shows `public` as the output
directory. Paths in `index.html` are relative (`assets/…`), so the `assets`
folder must stay next to `index.html`.

## External resources — REPLACE BEFORE LAUNCH

These are hot-linked to third-party CDNs. They render fine, but should be
self-hosted for production (reliability, privacy, page speed):

| Resource | Where used | Source |
|---|---|---|
| Fraunces + Inter | all typography | Google Fonts |
| 3 city photos | Locations section | Pexels (free licence) |
| Doctor video + poster | "Guided by Doctors" | Pexels (free licence) |

**To self-host:** download each file, drop it in `public/assets/`, and
update the `src` / `href`. The Pexels assets are free for commercial use
with no attribution required. Ideally, replace the stock city photos and
doctor video with real footage of the clinics and surgical team.

## Placeholders to fill in

- `info@peakhairtransplant.com` — confirm this is the right inbox
- Stats marked with `*`: "5,000+ procedures", "15+ yrs experience",
  "Board-certified", "12-month aftercare". The **5.0 ★ / 60 Google reviews**
  figure is verified (Google, Sept 2026); the others are not.
- Before/after captions read "Sapphire FUE" only — add graft counts if wanted.

## Content notes

- Patient photos and hero video are Peak's own assets.
- Testimonials are verbatim Google reviews of the New York clinic
  (pulled Sept 2026), attributed by reviewer name. Consider Google's
  official review widget if you'd prefer them to update automatically.
- Treatments are Sapphire FUE, PRP Package, Stem Cell Therapy.
  Locations are Istanbul, New York, Miami.

## Browser support

Modern evergreen browsers. Hero and doctor videos are `muted` + `playsinline`
so they autoplay on iOS Safari and Android Chrome. The "Guided by Doctors"
video pauses when scrolled out of view. Fully responsive; breakpoints at
960 px and 600 px.
