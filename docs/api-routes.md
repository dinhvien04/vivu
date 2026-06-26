# API Routes

Tất cả backend API production dùng prefix `/api/v1`, trừ Swagger local tại `/docs`.

## Health/Meta

- `GET /api/v1/healthz`
- `GET /api/v1/readyz`
- `GET /api/v1/build-info`

## Public Data

- `GET /api/v1/places`
- `GET /api/v1/places/nearby`
- `GET /api/v1/places/:slug`
- `GET /api/v1/places/:slug/images`
- `GET /api/v1/categories`
- `GET /api/v1/regions`
- `GET /api/v1/search/suggest`

## AI

- `POST /api/v1/ai/chat`
- `GET /api/v1/ai/health`

Debug/deep health AI chỉ nên dùng khi env cho phép, đặc biệt tránh expose chi tiết provider ở production.

## Trip Planner

- `POST /api/v1/trip-plans/generate`
- `GET /api/v1/trip-plans`
- `GET /api/v1/trip-plans/:id`
- `GET /api/v1/trip-plans/shared/:shareId`
- `POST /api/v1/trip-plans/:id/share`
- `POST /api/v1/trip-plans/:id/unshare`
- `POST /api/v1/trip-plans/:id/save-to-collection`

## Leads & Reports

- `POST /api/v1/leads`
- `POST /api/v1/data-reports`

## Analytics

- `POST /api/v1/analytics/events`

## Admin

Admin endpoints yêu cầu xác thực và role phù hợp.

- `GET /api/v1/admin/leads`
- `GET /api/v1/admin/leads/:id`
- `PATCH /api/v1/admin/leads/:id/status`
- `PATCH /api/v1/admin/leads/:id/note`
- `GET /api/v1/admin/data-reports`
- `PATCH /api/v1/admin/data-reports/:id/status`
- `GET /api/v1/admin/places`
- `GET /api/v1/admin/places/:slug`
- `POST /api/v1/admin/places`
- `PATCH /api/v1/admin/places/:id`
- `DELETE /api/v1/admin/places/:id`
- `POST /api/v1/admin/places/:id/publish`
- `POST /api/v1/admin/places/:id/unpublish`
- `POST /api/v1/admin/places/:id/photos`
- `DELETE /api/v1/admin/places/:id/photos/:photoId`
- `GET /api/v1/admin/reviews`
- `POST /api/v1/admin/reviews/:id/hide`
- `POST /api/v1/admin/reviews/:id/restore`
- `POST /api/v1/admin/reviews/:id/report`
- `DELETE /api/v1/admin/reviews/:id`
- `GET /api/v1/admin/stats`
- `GET /api/v1/admin/audit-logs`
- `POST /api/v1/admin/media/sign`
