# Final Production Deployment & Verification Checklist

Follow this checklist manually after deploying the main branch to Vercel to ensure the public beta is running stably.

## Phase 1: Deployment & Basic Configuration
- [ ] **Code Merged**: Confirm the local changes are pushed and merged to `main` branch.
- [ ] **Vercel Web Deploy**: Verify that the Vercel project `vivu-web` compiles and deploys the latest commit successfully.
- [ ] **Vercel API Deploy**: Verify that the Vercel project `vivu-api` compiles and deploys the latest commit successfully.
- [ ] **Environment Variables**: Double-check that production secrets (database URL, JWT, AWS S3 keys, Qdrant cluster details, Gemini API Key, Turnstile credentials) are set correctly and are not exposed.

## Phase 2: Metadata & Route Verification
- [ ] **Web Build Info**: Open `https://vivu-web.vercel.app/build-info` and confirm it returns the correct metadata and `commitSha` matching Vercel without exposing secrets.
- [ ] **API Build Info**: Open `https://vivu-api.vercel.app/api/v1/build-info` and confirm it matches the web commit and returns safe metadata.
- [ ] **Locale Prefixes**:
  - Open `https://vivu-web.vercel.app/` (Must load in Vietnamese).
  - Open `https://vivu-web.vercel.app/en` (Must load in English).

## Phase 3: Core Features & Turnstile Check
- [ ] **Itinerary Form**: Open `/lich-trinh` and ensure the form loads and responds.
- [ ] **Consulting Form**: Open `/tu-van` and ensure the Turnstile widget renders correctly.
- [ ] **Lead Submission**: Fill in the form and submit. Ensure it is successful.
- [ ] **Admin Verification**: Access the admin panel (or check database) to verify the submitted lead appears.
- [ ] **Detail Page**: Open `/dia-diem/suoi-da-vang` and confirm that description, images gallery, and map render without any errors.

## Phase 4: SEO & Legal Pages
- [ ] **robots.txt**: Open `/robots.txt` and ensure sitemap URL matches and private routes are disallowed.
- [ ] **sitemap.xml**: Open `/sitemap.xml` and ensure public routes are visible while private/admin/shared-itineraries paths are excluded.
- [ ] **Google Search Console**: Verify sitemap submission.
- [ ] **Legal Links**: Scroll to the footer and check that links to **Chính sách bảo mật**, **Điều khoản sử dụng**, and **Liên hệ** open their respective pages.

## Phase 5: Monitoring & Quota Verification
- [ ] **Uptime Monitors**: Set up uptime checkers pointing to health endpoints.
- [ ] **Billing Alerts**: Verify that budgets on Google Cloud, Vercel, Neon, and AWS are active.
