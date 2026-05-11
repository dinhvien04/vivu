# Tiến độ Vivu — Design vs. Implementation

> Đối chiếu giữa bộ design Stitch (30 màn hình + `docs/DESIGN.md` + logo) và mã nguồn hiện tại trong repo. Tick vào ô khi một mục được hoàn thành.
>
> Quy ước: `[x]` đã xong · `[ ]` chưa làm · 🟡 ghi chú nghĩa là làm một phần (xem chi tiết trong từng dòng).

## 1. Tóm tắt tổng

- [x] Hạ tầng monorepo (pnpm + Turborepo + Next.js 14 + NestJS 10 + Prisma + Docker compose)
- [x] Design system (Tailwind tokens khớp `docs/DESIGN.md`: màu, font Be Vietnam Pro + Inter, spacing 8px, container 1280px)
- [x] Database schema theo `docs/overview.md` (User, Place, Region, Category, Photo, Review, Question, Answer, Collection, Favorite, RefreshToken, PasswordResetToken)
- [ ] Database — `AuditLog` model (cần cho admin "Hoạt động Gần đây")
- [ ] PostGIS migration (`geography(Point, 4326)` + GIST index) — hiện dùng Haversine ở `places/nearby`
- [x] PG `pg_trgm` extension + GIN index trên `Place.titleVi` (xem `apps/api/prisma/schema.sql`)
- [x] CI / quality gates (`.github/workflows/ci.yml`: lint + typecheck + build + format)
- [x] i18n vi/en cho frontend (`next-intl` + segment `app/[locale]/` + `apps/web/messages/{vi,en}.json` + locale-aware sitemap với `hreflang`)
- [x] SEO: `sitemap.ts`, `robots.ts`, JSON-LD `TouristAttraction`
- 🟡 MeiliSearch + typeahead — [x] typeahead UI ở header search (debounce 200ms, keyboard nav) dùng `/places?q=`; [ ] chưa có MeiliSearch service / endpoint `search/suggest` riêng
- [ ] Google OAuth (UI đã có nút "Tiếp tục với Google" trong `/dang-nhap` + `/dang-ky`, chưa wire `passport-google`)
- [x] Dark mode (`ThemeProvider` + `ThemeToggle` + preflight script chống FOUC; site-header đã wire)

## 2. Trang public

| Màn hình thiết kế                                             | Đường dẫn dự kiến                 | Trạng thái                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vivu_kh_m_ph_du_l_ch_vi_t_nam` (Trang chủ)                   | `/`                               | [x] Có Hero, "Công cụ hỗ trợ hành trình", "Cảm hứng lên đường", footer                                                                                                                                                                                                         |
| `vivu_kh_m_ph_a_i_m_du_l_ch` (Khám phá / list)                | `/kham-pha`                       | 🟡 [x] danh sách + tab vùng miền (động) + skeleton + chip danh mục + filter mùa + sort recent/name + filter rating + rating trên PlaceCard; [ ] switch sang Map view                                                                                                           |
| `vivu_chi_ti_t_a_i_m_v_nh_h_long` (Chi tiết địa điểm)         | `/dia-diem/[slug]`                | [x] hero + breadcrumb + meta cards + mô tả + map placeholder + sidebar action + nearby places (Haversine) + weather widget (Open-Meteo) + viết đánh giá + Q&A + JSON-LD `TouristAttraction` + **gallery slider** (`PlaceGallery`: hero + thumbnails + lightbox + keyboard nav) |
| `vivu_b_n_t_ng_t_c_kh_m_ph_du_l_ch` (Bản đồ tương tác)        | `/ban-do`                         | [x] Leaflet + marker cluster + filter chip vung/chủ đề + chuyển nền Chuẩn/Vệ tinh/Địa hình, popup mini-card + link sang chi tiết                                                                                                                                               |
| `vivu_k_t_qu_t_m_ki_m_l_i` (Search results — lưới)            | `/tim-kiem?q=&view=grid`          | [x] Lưới 3 cột + sidebar filter (region/category/season) + sort (recent/name)                                                                                                                                                                                                  |
| `vivu_k_t_qu_t_m_ki_m_b_n` (Search results — bản đồ)          | `/tim-kiem?q=&view=map`           | [x] view=map Leaflet thật qua `PlacesMapLoader` (cùng component với `/ban-do`) + hint số địa điểm có toạ độ                                                                                                                                                                    |
| `vivu_k_t_qu_t_m_ki_m_danh_s_ch` (Search results — danh sách) | `/tim-kiem?q=&view=list`          | [x] List row layout (thumbnail + title + summary + categories)                                                                                                                                                                                                                 |
| `vivu_kh_ng_t_m_th_y_k_t_qu` (No results)                     | `/tim-kiem?q=…` (state empty)     | [x] EmptyState + gợi ý "Xem tất cả địa điểm"                                                                                                                                                                                                                                   |
| `vivu_s_tay_c_a_t_i` (Sổ tay danh sách)                       | `/so-tay`                         | [x] List sổ tay của tôi, tạo mới inline, xoá, auth-gated                                                                                                                                                                                                                       |
| `vivu_chi_ti_t_s_tay_m_a_h_mi_n_b_c` (Chi tiết sổ tay)        | `/so-tay/[id]`                    | [x] Chi tiết + grid place card, bỏ place khỏi sổ tay, edit name/desc/public                                                                                                                                                                                                    |
| `vivu_vi_t_nh_gi_a_i_m` (Viết đánh giá)                       | `/dia-diem/[slug]/danh-gia/moi`   | [x] Form viết đánh giá (rating 1-5 + content), auth-gated, redirect về detail sau khi gửi                                                                                                                                                                                      |
| `vivu_h_i_p_c_ng_ng_danh_s_ch` (Q&A list)                     | `/hoi-dap`                        | [x] List câu hỏi mới nhất, link tới detail, link "Tìm địa điểm để hỏi"                                                                                                                                                                                                         |
| `vivu_chi_ti_t_c_u_h_i_c_ng_ng` (Q&A detail)                  | `/hoi-dap/[id]`                   | [x] Chi tiết câu hỏi + answers list + form trả lời + xoá (owner)                                                                                                                                                                                                               |
| `vivu_trang_c_nh_n` (Trang cá nhân)                           | `/u/[username]` hoặc `/tai-khoan` | [x] Hồ sơ + stats + tabs (đánh giá / sổ tay / yêu thích) — `/tai-khoan`                                                                                                                                                                                                        |
| `vivu_c_i_t_t_i_kho_n` (Cài đặt tài khoản)                    | `/tai-khoan/cai-dat`              | [x] Cập nhật hồ sơ + đổi mật khẩu + xoá tài khoản + placeholder 2FA + Tài khoản đã liên kết (Google) + Xuất dữ liệu (JSON/CSV)                                                                                                                                                 |
| `vivu_logo`                                                   | (asset)                           | [x] `apps/web/public/vivu-logo.png`                                                                                                                                                                                                                                            |

## 3. Trang xác thực

| Màn hình thiết kế     | Đường dẫn                              | Trạng thái                                                                   |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| `vivu_ng_nh_p`        | `/dang-nhap`                           | 🟡 [x] form email/password + nút UI "Tiếp tục với Google" (chưa wire OAuth); |
| `vivu_ng_k_t_i_kho_n` | `/dang-ky`                             | 🟡 [x] form đăng ký + nút UI "Tiếp tục với Google" (chưa wire OAuth)         |
| `vivu_qu_n_m_t_kh_u`  | `/quen-mat-khau` + `/dat-lai-mat-khau` | [x] Đủ 2 bước                                                                |

## 4. Khu admin

| Màn hình thiết kế             | Đường dẫn                | Trạng thái                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vivu_admin_t_ng_quan`        | `/admin`                 | 🟡 [x] thẻ stat (Tổng địa điểm + Phân bố theo vùng + Recent places); [x] khối "Hoạt động Gần đây" (recent reviews); [x] khối "Sức khoẻ Hệ thống" (API/DB/CDN ping); [x] khối "Thao tác nhanh" + nút "Xuất báo cáo" (UI placeholder); 🟡 [x] thẻ stat "Đánh giá" + "Người dùng tích cực" có UI nhưng giá trị đang hard-code `0` / `—` (chưa wire API thật) |
| `vivu_admin_qu_n_l_a_i_m`     | `/admin/dia-diem`        | [x] bảng + tabs vùng + form tìm; [x] route `/admin/dia-diem/new`; [x] thao tác delete/publish/unpublish trên từng dòng                                                                                                                                                                                                                                    |
| `vivu_admin_ch_nh_s_a_a_i_m`  | `/admin/dia-diem/[slug]` | [x] form đầy đủ (PATCH); [x] chọn region/category/best season; [x] upload trực tiếp ảnh hero qua Cloudinary; [x] nút publish/unpublish/xoá                                                                                                                                                                                                                |
| `vivu_admin_ki_m_duy_t_nh_gi` | `/admin/danh-gia`        | [x] gắn API thật; [x] tabs theo status (Bị báo cáo/Đang hiển thị/Đã ẩn) với count động; [x] nút Ẩn/Khôi phục                                                                                                                                                                                                                                              |

## 5. Trạng thái hệ thống

- [x] `vivu_l_i_404_kh_ng_t_m_th_y_trang` → `not-found.tsx`
- [x] `vivu_l_i_500_l_i_h_th_ng` → `error.tsx`
- [x] `vivu_m_t_k_t_n_i_internet` → `/mat-ket-noi`
- [x] `vivu_trang_b_o_tr` → `/bao-tri`
- [x] `vivu_tr_ng_th_i_ang_t_i_skeleton` → `<Skeleton />` + `kham-pha/loading.tsx`
- [x] `vivu_tr_ng_th_i_tr_ng_v_th_ng_b_o_th_nh_c_ng` → `<EmptyState />` + `<StatusPage />`

## 6. Backend API

> Tham chiếu danh sách endpoint trong `docs/overview.md` mục 7.

### Public

- [x] `GET /api/v1/places` — hỗ trợ `q`, `region`, `category`, `season`, `sort`, `page`, `pageSize`
- [x] `GET /api/v1/places/:slug`
- [x] `GET /api/v1/places/:slug/reviews`
- [x] `GET /api/v1/places/nearby?lat=&lng=&radius=&limit=&excludeSlug=` (Haversine, không cần PostGIS)
- [x] `GET /api/v1/categories`
- [x] `GET /api/v1/regions`
- [ ] `GET /api/v1/search/suggest?q=` (typeahead)

### Auth

- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `POST /api/v1/auth/refresh` (rotate refresh token)
- [x] `POST /api/v1/auth/logout`
- [x] `POST /api/v1/auth/forgot-password` (token in-DB; gửi email là stub log)
- [x] `POST /api/v1/auth/reset-password`
- [x] `POST /api/v1/auth/change-password`
- [x] `POST /api/v1/auth/me`
- [ ] Google OAuth (passport-google)

### User actions

- [x] `POST/DELETE /api/v1/places/:id/favorite` (idempotent; 401 nếu chưa auth)
- [x] `GET /api/v1/places/:id/favorite` — status check (auth required)
- [x] `GET /api/v1/me/favorites` — list địa điểm đã lưu (auth required)
- [x] `POST /api/v1/places/:id/reviews`
- [x] `PATCH/DELETE /api/v1/reviews/:id` + `GET /me/reviews`
- [x] `GET/POST/PATCH/DELETE /api/v1/me/collections[/:id][/items]`
- [x] Q&A endpoints (`GET /questions`, `POST /places/:id/questions`, `GET/DELETE /questions/:id`, `POST /questions/:id/answers`, `DELETE /answers/:id`, public list status visible)

### Media

- [x] `POST /api/v1/admin/media/sign` — controller (`apps/api/src/media/media.controller.ts`) + `CloudinaryService.signUploadParams()` (auth + role admin/editor)

### Admin

- [x] `POST/PATCH/DELETE /api/v1/admin/places[/:id]`
- [x] `POST /api/v1/admin/places/:id/publish` + `unpublish`
- [x] `GET /api/v1/admin/reviews?status=` + `POST /admin/reviews/:id/hide` / `restore` / `report` + `DELETE /admin/reviews/:id`

## 7. Quan sát chi tiết & rủi ro nhỏ cần fix sớm

- [x] Header `apps/web/src/components/site-header.tsx` — đã đơn giản NAV_ITEMS thành `Trang chủ` + `Khám phá` (ẩn `/diem-den`, `/luu-tru`, `/cam-nang` cho đến khi có content).
- [x] Trang chủ đã chuyển sang server component, fetch top 1 place / mỗi vùng và rút `heroImageUrl` từ DB (Cloudinary). Hắn URL `lh3.googleusercontent.com/aida-public/...` đã loại bỏ.
- [x] Bật "Lưu thay đổi" cho `apps/web/src/app/admin/dia-diem/[slug]/page.tsx` (PATCH).
- [x] Thay mock review trong `apps/web/src/app/admin/danh-gia/page.tsx` bằng `/admin/reviews?status=`.
- [x] i18n: `next-intl` + segment `app/[locale]/` + `apps/web/messages/{vi,en}.json` (helpers ở `apps/web/src/i18n/place.ts` đọc `*En` khi locale = en, fallback về `*Vi`).
- [x] SEO: `sitemap.ts` + `robots.ts` đã có, JSON-LD `TouristAttraction` đã được inline trên place detail.
- 🟡 Search: chưa thêm MeiliSearch service vào `docker-compose.yml`. `pg_trgm` đã có trong `schema.sql` (GIN index trên `Place.titleVi`); typeahead UI dùng `/places?q=`.
- [x] Dark mode: `ThemeProvider` + `ThemeToggle` ở site-header (preflight script chống FOUC).
- [x] Header `NotificationsButton` (chuông) — hiển thị khi user đã login (admin hoặc surface authenticated); dropdown placeholder vì notifications backend chưa có.

## 8. Đề xuất ưu tiên (MVP → v1)

> Bám theo lộ trình `docs/PROJECT.md` mục 8.

### Sprint kế tiếp (MVP còn thiếu)

- [x] `/dia-diem/[slug]` — page chi tiết (hero, breadcrumb, meta cards, mô tả, map placeholder, sidebar action, nearby places, QaSection inline, weather widget, JSON-LD). Còn TODO: gallery slider.
- [x] API filter `category` + `season` + `sort` cho `GET /places`.
- [x] `GET /api/v1/regions`, `GET /api/v1/categories` để frontend render tab/filter động.
- [x] `/ban-do` — Leaflet + OSM/Esri Satellite/OpenTopoMap tile + leaflet.markercluster + filter region/category + popup mini-card.
- [x] Favorites — backend (POST/DELETE/GET status + GET /me/favorites) + nút "Thêm vào sổ tay" optimistic trên `/dia-diem/[slug]` + page `/tai-khoan/yeu-thich`.
- [x] Admin CRUD places — backend POST/PATCH/DELETE/publish/unpublish (auth + role admin/editor) + bật form edit + tạo `/admin/dia-diem/new` + nút delete/publish/unpublish trên list. (🟡 còn upload trực tiếp ảnh hero qua Cloudinary, tạm thời dán URL.)

### v1

- [x] Reviews API + UI write-review + admin moderation thật (thay mock).
- [x] Collections / Sổ tay (list + detail + add/remove item) — **PR #19**.
- [x] Search results page (`/tim-kiem`) với 3 view (grid/list/map Leaflet) + sidebar filter; header search input + typeahead dropdown đã redirect tới `/tim-kiem?q=`. Còn thiếu: MeiliSearch service + endpoint `search/suggest` riêng.
- [x] i18n vi/en (FE `next-intl` + segment `[locale]/` + `messages/{vi,en}.json` đầy đủ + locale-aware sitemap có `hreflang`).
- [x] SEO: `sitemap.ts`, `robots.ts`, JSON-LD `TouristAttraction` cho place detail.
- [ ] Google OAuth.

### v1.x

- [x] Q&A list + detail + post answer.
- [ ] Trang cá nhân + cài đặt tài khoản (2FA, ngắt liên kết Google, lịch sử đăng nhập, xoá tài khoản).
- [ ] AuditLog model + admin "Hoạt động Gần đây".

## 9. Kết luận nhanh

- [x] Đã có (~85%): hạ tầng monorepo, design system khớp `DESIGN.md`, schema DB đầy đủ (trừ `AuditLog`), hệ thống auth chắc chắn (rotate refresh token + reset password + change password), toàn bộ luồng đọc places (list + detail + nearby + map cluster + weather), favourites + collections (sổ tay) + reviews + Q&A, toàn bộ admin CRUD (places + review moderation + Cloudinary upload), i18n vi/en, dark mode, SEO + sitemap có `hreflang`, typeahead header, gallery slider.
- [ ] Còn thiếu chính (~15%):
  - **Backend:** Google OAuth (passport-google), `AuditLog` model + endpoint, PostGIS migration (`geography(Point, 4326)` + GIST), MeiliSearch service / `search/suggest` endpoint riêng.
  - **Frontend:** switch Map view trên `/kham-pha`, số liệu thật cho thẻ "Đánh giá" + "Người dùng tích cực" ở `/admin`, wire 2FA / ngắt liên kết Google / lịch sử đăng nhập ở `/tai-khoan/cai-dat` (hiện là placeholder).
