# Test Report — `@vivu/api`

Báo cáo unit test cho backend API `apps/api`. Cấu hình Jest mới được setup ở
PR này — trước đó repo chưa có test nào.

> **Cách chạy:**
>
> ```bash
> pnpm --filter @vivu/api test                # unit (94 tests, không cần DB)
> pnpm --filter @vivu/api test:int            # integration (30 tests, cần Docker)
> pnpm --filter @vivu/api test -- search      # filter theo tên file
> pnpm --filter @vivu/api jest --coverage     # kèm coverage
> ```

## 1. Tóm tắt kết quả

**Unit tests** (`pnpm test`)

| Hạng mục          | Giá trị             |
| ----------------- | ------------------- |
| **Test suites**   | **11 / 11 passed**  |
| **Test cases**    | **94 / 94 passed**  |
| **Failed**        | 0                   |
| **Time**          | ~1.0 s              |
| **Snapshots**     | 0                   |
| **Typecheck**     | passed (tsc clean)  |

**Integration tests** (`pnpm test:int` — cần Docker)

| Hạng mục          | Giá trị                                          |
| ----------------- | ------------------------------------------------ |
| **Test suites**   | **4 / 4 passed**                                 |
| **Test cases**    | **30 / 30 passed**                               |
| **Time**          | ~12 s (lần đầu ~30 s do pull image)               |
| **Container**     | `postgis/postgis:15-3.4` qua `testcontainers`    |
| **DB schema**     | `prisma db push` + PostGIS extensions/trigger/index |

> _Combined total:_ **124 tests** (94 unit + 30 integration).
>
> _Cập nhật:_ PR sau bổ sung **4 controller suites** (18 tests) và **4 integration suites** (30 tests) — xem mục 4.7 và mục 5.

## 2. Tổng quan từng suite

| #  | File                                                       | Module                       | Tests | Trạng thái |
| -- | ---------------------------------------------------------- | ---------------------------- | ----- | ---------- |
|  1 | `src/search/search.service.spec.ts`                        | `SearchService.suggest`      | 11    | ✓ pass     |
|  2 | `src/search/search-index.service.spec.ts`                  | `SearchIndexService`         | 20    | ✓ pass     |
|  3 | `src/search/dto/suggest.query.dto.spec.ts`                 | `SuggestQueryDto` validation | 9     | ✓ pass     |
|  4 | `src/audit-logs/audit-logs.service.spec.ts`                | `AuditLogsService`           | 12    | ✓ pass     |
|  5 | `src/audit-logs/dto/list-audit-logs.query.dto.spec.ts`     | `ListAuditLogsQueryDto`      | 8     | ✓ pass     |
|  6 | `src/admin-stats/admin-stats.service.spec.ts`              | `AdminStatsService.snapshot` | 7     | ✓ pass     |
|  7 | `src/places/places.service.spec.ts`                        | `PlacesService.listNearby`   | 9     | ✓ pass     |
|  8 | `src/search/search.controller.spec.ts`                     | `SearchController`           | 5     | ✓ pass     |
|  9 | `src/audit-logs/audit-logs.controller.spec.ts`             | `AuditLogsController`        | 4     | ✓ pass     |
| 10 | `src/admin-stats/admin-stats.controller.spec.ts`           | `AdminStatsController`       | 3     | ✓ pass     |
| 11 | `src/places/places.controller.spec.ts`                     | `PlacesController`           | 6     | ✓ pass     |

## 3. Coverage (file đã có test)

| File                                              | Stmts   | Branch  | Funcs   | Lines   |
| ------------------------------------------------- | ------- | ------- | ------- | ------- |
| `src/search/search.controller.ts`                 | 100 %   | 75 %    | 100 %   | 100 %   |
| `src/audit-logs/audit-logs.controller.ts`         | 100 %   | 75 %    | 100 %   | 100 %   |
| `src/admin-stats/admin-stats.controller.ts`       | 100 %   | 75 %    | 100 %   | 100 %   |
| `src/places/places.controller.ts`                 | 100 %   | 82.4 %  | 100 %   | 100 %   |
| `src/search/search.service.ts`                    | 100 %   | 81.8 %  | 100 %   | 100 %   |
| `src/search/search-index.service.ts`              | 80.5 %  | 75 %    | 83.3 %  | 80.3 %  |
| `src/audit-logs/audit-logs.service.ts`            | 100 %   | 88.2 %  | 100 %   | 100 %   |
| `src/admin-stats/admin-stats.service.ts`          | 100 %   | 75 %    | 100 %   | 100 %   |
| `src/places/places.service.ts` (`listNearby`)     | 45.4 %  | 32.5 %  | 53.3 %  | 42.9 %  |

> `places.service.ts` tổng thể coverage thấp vì test PR này chỉ tập trung vào
> `listNearby` (PostGIS path mới). Hàm `list()` và `findBySlug()` đã ổn định
> qua nhiều PR trước, sẽ bổ sung test ở PR sau nếu cần.

## 5. Integration tests (Postgres + PostGIS)

Từng được bổ sung ở PR riêng — spin lên container `postgis/postgis:15-3.4`
qua [`testcontainers-node`](https://node.testcontainers.org/), áp schema bằng
`prisma db push` + PostGIS-specific bootstrap (extensions, trigger, GIST/GIN
index). Từ đó chạy thật với DB để verify SQL hiểu một cách chuẩn.

**Config:** `apps/api/jest.int.config.js` (testRegex chỉ match `*.int.spec.ts`,
`globalSetup` start container, `globalTeardown` stop, `--runInBand`).

**Helper:** `apps/api/test/integration/prisma-helper.ts` cung cấp
`getPrisma()` + `truncateAll()` (TRUNCATE CASCADE 16 bảng để cô lập test).

| #  | Suite                                            | Tests | Trạng thái |
| -- | ------------------------------------------------ | ----- | ---------- |
|  1 | `test/integration/places-listNearby.int.spec.ts` | 10    | ✓ pass     |
|  2 | `test/integration/search-pgTrgm.int.spec.ts`     | 8     | ✓ pass     |
|  3 | `test/integration/audit-logs.int.spec.ts`        | 6     | ✓ pass     |
|  4 | `test/integration/admin-stats.int.spec.ts`       | 6     | ✓ pass     |

### 5.1 `PlacesService.listNearby` (PostGIS real)

Seed 4 địa điểm thật quanh Hà Nội + 1 draft. Cross-check distance với
Haversine reference. Tập test:

- ✓ trả places trong bán kính, sort distance ASC
- ✓ distance khop Haversine (sai số <2% cho điểm >5km)
- ✓ loại `status != 'published'`
- ✓ respect `radiusKm` (3km không trả Hồ Tây 5km)
- ✓ bán kính 200km trả Vịnh Hạ Long cuối list
- ✓ `excludeSlug` loại đúng row
- ✓ respect `limit`
- ✓ clamp `limit=0 → 1`
- ✓ trigger `place_geo_sync` cập nhật `geo` khi UPDATE lat/lng

### 5.2 `SearchService.suggest` fallback pg_trgm

Mock `SearchIndexService.suggest` trả null để force pg_trgm path. Seed 5
places với tên tiếng Việt (Vịnh Hạ Long, Vịnh Lan Hạ, Hà Nội, Hà Giang, Đà Nẵng).

- ✓ `q < 2` trả `[]`
- ✓ exact substring titleVi match đầu list
- ✓ match titleEn khi titleVi miễn
- ✓ rank similarity DESC (Hạ/Hà đứng trước Đà)
- ✓ loại `status != 'published'`
- ✓ respect limit
- ✓ clamp `limit=100 → 20`
- ✓ verify Meili-disabled path gọi `index.suggest()` 1 lần

### 5.3 `AuditLogsService` (record + list)

- ✓ `record()` tạo row với actor full + metadata JSON
- ✓ `record({actorId: null})` tạo row hệ thống (actor=null)
- ✓ `list()` sort `createdAt DESC`
- ✓ `list({page:2, pageSize:2})` phân trang đúng
- ✓ `record({actorId: 'invalid'})` swallow + không tạo row (best-effort)
- ✓ xóa actor → list() vẫn trả row với actor=null (ON DELETE SET NULL)

### 5.4 `AdminStatsService.snapshot` (counting logic)

- ✓ DB rỗng → zero
- ✓ `totalPlaces` đếm cả draft/published/archived
- ✓ `activeUsers` dedupe khi 1 user có nhiều activity
- ✓ `activeUsers` hợp 3 nguồn (review + question + answer) → tập duy nhất
- ✓ `activeUsers` loại activity ngoài cửa sổ 30 ngày
- ✓ `totalReviews` đếm cả visible/hidden/reported


## 4. Chi tiết theo suite

### 4.1 `SearchService.suggest` — `src/search/search.service.spec.ts`

11 tests bao gói:

- ✓ trả `[]` khi q < 2 ký tự
- ✓ trả `[]` khi q toàn whitespace
- ✓ trim whitespace trước khi check length (3 spaces + "ha" → length 2 pass)
- ✓ trả Meili result trực tiếp (không gọi DB) khi `SearchIndexService.suggest` non-null
- ✓ fallback xuống pg_trgm khi Meili trả null
- ✓ fallback và trả empty khi DB không match
- ✓ default `limit = 8` nếu không truyền
- ✓ tôn trọng `limit` hợp lệ
- ✓ clamp `limit` về 20 nếu lớn hơn
- ✓ clamp `limit` về 1 nếu = 0
- ✓ clamp `limit` về 1 nếu âm

### 4.2 `SearchIndexService` — `src/search/search-index.service.spec.ts`

20 tests, chia 2 nhóm:

**Disabled (no `MEILI_HOST`)**

- ✓ `isEnabled()` = false
- ✓ `onApplicationBootstrap` no-op
- ✓ `indexPlace` / `removePlace` no-op
- ✓ `suggest` trả `null` để caller fallback

**Enabled (có `MEILI_HOST`)**

- ✓ `isEnabled()` = true
- ✓ truyền `apiKey` vào client constructor khi có
- ✓ tôn trọng `MEILI_INDEX_PLACES` override
- ✓ default tên index = `"places"`
- ✓ bootstrap idempotent (chỉ ensure index 1 lần qua 2 lần gọi)
- ✓ `updateSettings` gọi với schema chuẩn (searchable/filterable/sortable)
- ✓ swallow lỗi "createIndex already exists" và vẫn update settings
- ✓ disable client khi `updateSettings` throw
- ✓ `indexPlace` push document theo shape `toDocument` (regionSlug, updatedAt timestamp, …)
- ✓ `indexPlace` short-circuit khi place không tồn tại
- ✓ `indexPlace` swallow lỗi Meili (best-effort)
- ✓ `removePlace` gọi `deleteDocument(id)`
- ✓ `removePlace` swallow lỗi Meili
- ✓ `suggest` filter `status = published` + map hits về public shape (loại field thừa)
- ✓ `suggest` trả `null` khi Meili throw

### 4.3 `PlacesService.listNearby` — `src/places/places.service.spec.ts`

9 tests cover toàn bộ logic PostGIS:

- ✓ trả `[]` khi raw query không có hàng (skip enrichment + groupBy)
- ✓ giữ đúng thứ tự distance (kiểm tra việc reorder vì `findMany IN` không bảo toàn order)
- ✓ chuyển đổi mét → km và làm tròn 1 dp (1234 m → 1.2 km)
- ✓ clamp `limit` về max 50
- ✓ clamp `limit` về min 1
- ✓ `radiusKm * 1000` được truyền xuống query (mét)
- ✓ gắn rating `{ count, average }` từ `review.groupBy`
- ✓ rating mặc định `{ count: 0, average: 0 }` khi không có review
- ✓ enrichment vẫn chạy bình thường khi truyền `excludeSlug` (filter ở SQL)

### 4.4 `AuditLogsService` — `src/audit-logs/audit-logs.service.spec.ts`

12 tests, 2 nhóm:

**`record()`**

- ✓ create row với đầy đủ field
- ✓ default `entityId` = null khi omit
- ✓ chấp nhận `actorId = null` (system actions)
- ✓ **không throw** khi `create` fail (best-effort + log error)

**`list()`**

- ✓ default `page=1, pageSize=20` khi gọi rỗng
- ✓ `skip = (page-1) * pageSize`
- ✓ order `createdAt desc`
- ✓ include actor `{ id, name, avatarUrl }`
- ✓ map row có actor → response shape (ISO timestamps)
- ✓ map row actor=null → `actor: null`
- ✓ map metadata=null → `null`
- ✓ `total` lấy từ `count()`, không phải `rows.length`

### 4.5 `AdminStatsService.snapshot` — `src/admin-stats/admin-stats.service.spec.ts`

7 tests:

- ✓ trả 0 hết khi DB rỗng
- ✓ forward `totalPlaces` / `totalReviews` từ Prisma
- ✓ `computedAt` là ISO string
- ✓ user xuất hiện ở cả review + question + answer → đếm 1 lần
- ✓ activeUsers = distinct union giữa 3 nguồn
- ✓ window 30 ngày (`since` ≈ now - 30d) truyền xuống Prisma
- ✓ dùng `distinct: ['userId']` khi findMany

### 4.7 Controller layer

4 suites mới, 18 tests, dùng `Test.createTestingModule` (NestJS) để bootstrap module ảo:

**`SearchController`** — 5 tests:

- ✓ delegate `service.suggest(q, limit)` với đúng arg
- ✓ forward `limit = undefined` xuống service (service tự áp default)
- ✓ bọc result trong `{ data }`
- ✓ bọc empty result thành `{ data: [] }`
- ✓ propagate error từ service

**`AuditLogsController`** — 4 tests (override `JwtAuthGuard` + `RolesGuard`):

- ✓ delegate `service.list({ page, pageSize })` nguyên xi
- ✓ forward empty query (service áp default)
- ✓ trả result verbatim (không reshape)
- ✓ propagate error

**`AdminStatsController`** — 3 tests:

- ✓ delegate `service.snapshot()` không arg
- ✓ bọc kết quả thành `{ data }`
- ✓ propagate error

**`PlacesController`** — 6 tests (3 endpoint):

- ✓ `GET /places` delegate `service.list(query)` nguyên xi
- ✓ `GET /places/nearby` áp default `radius=50`, `limit=8` khi không truyền
- ✓ `GET /places/nearby` tôn trọng radius + limit + excludeSlug khi có
- ✓ `GET /places/nearby` bọc result `{ data }`
- ✓ `GET /places/:slug` trả `{ data }` khi tìm thấy
- ✓ `GET /places/:slug` throw `NotFoundException` (msg tiếng Việt) khi miss

### 4.6 DTO validation

**`SuggestQueryDto`** — 9 tests:

- ✓ accept q 2 ký tự
- ✓ accept q dài + limit hợp lệ (transform string → number)
- ✓ reject q 1 ký tự
- ✓ reject thiếu q
- ✓ reject q non-string
- ✓ reject `limit < 1`
- ✓ reject `limit > 20`
- ✓ transform `"8"` → number
- ✓ reject `"3.5"` (non-integer)

**`ListAuditLogsQueryDto`** — 8 tests:

- ✓ accept empty payload (cả 2 field optional)
- ✓ accept valid page + pageSize (transform string → number)
- ✓ reject `page < 1`
- ✓ reject `pageSize < 1`
- ✓ reject `pageSize > 100`
- ✓ reject `page` non-integer (`"1.5"`)
- ✓ reject `page` non-numeric (`"abc"`)
- ✓ transform numeric strings → numbers

## 5. Phạm vi & hạn chế

### Cover được

- **Logic nghiệp vụ thuần (pure function path)** trong các service mới (Search,
  SearchIndex, AuditLogs, AdminStats, PostGIS nearby).
- **Hành vi fallback** khi Meili disabled / lỗi.
- **DTO validation** qua `class-validator` / `class-transformer`.
- **Edge case**: empty results, distinct dedup, clamping, ISO formatting.

### Chưa cover

- **Controller layer** (`*.controller.ts`): cần `Test.createTestingModule` +
  supertest. Để PR sau khi setup e2e harness.
- **Auth flow** (`auth/`): chưa test ở PR này — phụ thuộc nhiều mock JWT.
- **Prisma raw SQL semantics**: bài test này mock toàn bộ `$queryRaw`, không
  verify SQL chạy đúng trên Postgres thật. Cần integration test với DB ephemeral
  (testcontainers / `pg-mem`) — để PR sau.

## 6. Setup mới thêm

- `apps/api/jest.config.js` — Jest config (ts-jest, `*.spec.ts` regex,
  coverage scope khoanh `src/**` trừ modules/DTOs/main).
- Script `pnpm test` (đã có sẵn trong `package.json`) giờ chạy được.
- Tất cả test file đặt cạnh source theo convention NestJS (`*.spec.ts` cùng thư
  mục với `*.ts`).

---

_Generated trong PR test infra. Nếu muốn mở rộng (controller / e2e), comment
lại trong PR để mình bổ sung._
