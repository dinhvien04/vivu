# Test Report — `@vivu/api`

Báo cáo unit test cho backend API `apps/api`. Cấu hình Jest mới được setup ở
PR này — trước đó repo chưa có test nào.

> **Cách chạy:**
>
> ```bash
> pnpm --filter @vivu/api test                # chạy tất cả
> pnpm --filter @vivu/api test -- search      # filter theo tên file
> pnpm --filter @vivu/api jest --coverage     # kèm coverage
> ```

## 1. Tóm tắt kết quả

| Hạng mục          | Giá trị             |
| ----------------- | ------------------- |
| **Test suites**   | **11 / 11 passed**  |
| **Test cases**    | **94 / 94 passed**  |
| **Failed**        | 0                   |
| **Time**          | ~1.0 s              |
| **Snapshots**     | 0                   |
| **Typecheck**     | passed (tsc clean)  |

> _Cập nhật:_ PR sau bổ sung **4 controller suites** (18 tests) — xem mục 4.7.

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
