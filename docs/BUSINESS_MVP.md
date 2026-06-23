# Vivu Business MVP

Cap nhat: 23/06/2026.

Tai lieu nay tom tat cac tinh nang bien Vivu tu trang tra cuu dia danh thanh mot
MVP co dau ra kinh doanh: tao lich trinh, thu lead tu van, theo doi nhu cau va
nhan bao loi du lieu.

## Tinh nang moi

- Trip Planner AI: `POST /api/v1/trip-plans/generate`, route web `/lich-trinh`.
- Lead capture: `POST /api/v1/leads`, route web `/tu-van`.
- Admin CRM: `GET /api/v1/admin/leads`, route web `/admin/leads`, co drawer chi tiet va copy phone/Zalo.
- Data report: `POST /api/v1/data-reports`, nut bao loi tren trang chi tiet dia danh.
- Admin Data Report: `GET /api/v1/admin/data-reports`, route web `/admin/bao-loi`.
- Analytics event: `POST /api/v1/analytics/events`, dung cho place view, search, nearby CTA, AI chat, trip plan va lead.
- SEO: sitemap them `/lich-trinh`, `/tu-van`; detail page co TouristAttraction JSON-LD va Breadcrumb JSON-LD.

## Luong Trip Planner AI

Frontend chi goi Next proxy `/api/trip-plans/generate`. Backend:

1. Kiem tra quota ngay theo user hoac IP hash.
2. Lay candidate places tu PostgreSQL, khong lay truc tiep tu Qdrant.
3. Goi Gemini voi prompt chi cho phep dung danh sach dia danh Vivu.
4. Parse JSON response, bo `placeSlug` khong nam trong danh sach hop le.
5. Luu `TripPlan` va `TripPlanPlace` neu tao thanh cong.

Quy tac an toan:

- Khong chay embedding local.
- Khong tao lai collection Qdrant.
- Khong dua Gemini/Qdrant/AWS key ra frontend.
- Neu thieu du lieu, AI phai dien `missingDataNote`.

## Luong Lead

Nguoi dung gui form tu `/tu-van` hoac CTA tren detail/AI/trip planner. Backend:

- Validate name va phone/Zalo bat buoc.
- Co honeypot field `website`.
- Rate limit theo IP hash, mac dinh `LEADS_RATE_LIMIT_PER_HOUR=5`.
- Khong luu IP/user-agent tho; chi luu hash.
- Admin cap nhat status va internal note tai `/admin/leads`.

## Luong Data Report

Trang chi tiet dia danh co nut bao loi du lieu. Report gom:

- `placeSlug`
- `type`: `wrong_image`, `wrong_coordinates`, `wrong_description`, `missing_info`, `other`
- `message`
- `contact` tuy chon

Admin xu ly report tai `/admin/bao-loi`: loc theo trang thai/loai loi/slug, mo trang dia diem va cap nhat status.

## Migration

Migration business MVP tao:

- `TripPlan`
- `TripPlanPlace`
- `Lead`
- `DataReport`
- `AnalyticsEvent`
- Enum cho lead/report/analytics
- Cot `AiUsage.tripPlanRequests`

Lenh can chay khi deploy moi:

```bash
pnpm --filter @vivu/api prisma:migrate
pnpm --filter @vivu/api prisma:generate
```

## Env moi

```env
TRIP_PLANNER_DAILY_QUOTA_ANON=5
TRIP_PLANNER_DAILY_QUOTA_USER=20
LEADS_RATE_LIMIT_PER_HOUR=5
```

## Kiem thu thu cong

1. Mo `/lich-trinh`, tao lich trinh 2 ngay khu vuc Quy Nhon.
2. Bam `Gui yeu cau tu van` tu lich trinh.
3. Mo `/tu-van`, gui lead voi phone/Zalo test.
4. Dang nhap admin, mo `/admin/leads`, doi status va ghi note.
5. Mo mot trang `/dia-diem/:slug`, bam `Bao loi du lieu`, gui report.
6. Dang nhap admin, mo `/admin/bao-loi`, doi status mot report test.
7. Mo `/sitemap.xml`, kiem tra co `/lich-trinh` va `/tu-van`.

## Checklist production UI

- [x] `/` hien thi tieng Viet mac dinh voi hero ve lap lich trinh AI va tu van chuyen di.
- [x] Navigation public co `/lich-trinh` va `/tu-van`.
- [x] `/lich-trinh` mo duoc va co CTA gui yeu cau tu van.
- [x] `/tu-van` gui lead duoc qua `POST /api/v1/leads`.
- [x] `/admin/leads` xem va xu ly lead duoc.
- [x] `/admin/bao-loi` xem va xu ly report duoc.
- [x] `/sitemap.xml` co route kinh doanh `/lich-trinh` va `/tu-van`.

## Trang thai

- Logo va brand Vivu khong bi thay doi.
- Frontend khong goi truc tiep S3, Qdrant, Gemini.
- API key chi nam o backend env.
