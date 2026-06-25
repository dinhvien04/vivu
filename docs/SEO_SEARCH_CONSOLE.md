# SEO & Google Search Console Readiness Guide

This guide details the steps to index Vivu on search engines and verify optimization setup.

## 1. Google Search Console Configuration

### Step 1: Add Property
1. Go to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property**.
3. Choose **Domain** verification (preferred) or **URL prefix** verification.
   - For **URL prefix**, enter `https://vivu-web.vercel.app` (or your custom domain like `https://vivu.vn` once purchased).

### Step 2: Verify Site Ownership
- **DNS TXT Record** (Recommended for Domain property): Add the generated TXT record in your DNS registrar settings.
- **HTML file**: Download the verification file and place it under `apps/web/public/` folder, then deploy.
- **HTML Tag**: Add the meta tag in the root layout metadata setting.

### Step 3: Submit Sitemap
1. Select your property in Search Console.
2. Click **Sitemaps** in the left menu.
3. Enter the sitemap URL path: `sitemap.xml`.
4. Click **Submit**. Google will fetch `https://<your-domain>/sitemap.xml` and begin crawl jobs.

---

## 2. SEO Best Practices Setup in Vivu

### robots.txt
- Location: `/robots.txt` (dynamically served by [robots.ts](file:///D:/vivu/apps/web/src/app/robots.ts)).
- Excludes administrative, user account, and private API routes.
- Points to the dynamic sitemap at the root.

### sitemap.xml
- Location: `/sitemap.xml` (dynamically served by [sitemap.ts](file:///D:/vivu/apps/web/src/app/sitemap.ts)).
- Includes all localized public paths (`/`, `/kham-pha`, `/ban-do`, `/lich-trinh`, `/tu-van`, `/ai-chat`, `/tim-kiem`).
- Fetches and indexes all published places dynamically from the API database.
- Explicitly excludes shared itineraries and internal paths.

### Metadata & Alternate Locales
- Each public route specifies correct `title`, `description`, and OpenGraph tags.
- Detailed place pages render dynamically using metadata defined per tourist attraction in their database models.
- Multilingual alternates are generated automatically using standard locale URLs (e.g. standard vs. `/en` prefixes) to prevent duplicate content penalties.
- Shared user itineraries are locked down with `<meta name="robots" content="noindex, nofollow" />` (controlled via `robots: { index: false, follow: false }` metadata in [page.tsx](file:///D:/vivu/apps/web/src/app/%5Blocale%5D/lich-trinh/chia-se/%5BshareId%5D/page.tsx)) to avoid indexing low-quality/user-generated routes.
