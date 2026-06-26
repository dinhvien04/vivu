# Operations

Index vận hành production cho Vivu. File này không thay thế checklist chi tiết, chỉ gom đường dẫn và các thao tác quan trọng.

## Production URLs

- Web: <https://vivu-web.vercel.app>
- API: <https://vivu-api.vercel.app>
- Web build info: <https://vivu-web.vercel.app/build-info>
- API build info: <https://vivu-api.vercel.app/api/v1/build-info>

## Deploy

- Web deploy trên Vercel.
- API deploy trên Vercel.
- Production branch hiện dùng `main`.
- Xem thêm [Deploy checklist](DEPLOY_CHECKLIST.md).

## Verify & Smoke Test

- [Production verify](PRODUCTION_VERIFY.md)
- [Production smoke test](PRODUCTION_SMOKE_TEST.md)
- [Production final checklist](PRODUCTION_FINAL_CHECKLIST.md)

## Migration

- [Production migration checklist](PRODUCTION_MIGRATION_CHECKLIST.md)
- Migration nên dùng direct database URL nếu hạ tầng database yêu cầu.
- Không chạy destructive migration khi chưa có backup/rollback plan.

## Monitoring

- [Monitoring checklist](MONITORING_CHECKLIST.md)
- Theo dõi uptime, error rate, API latency, quota provider và log privacy.

## Cost Guardrails

- [Cost guardrails](COST_GUARDRAILS.md)
- Theo dõi Gemini, Qdrant, Vercel, Neon và S3.

## Backup & Restore

- [Backup and restore](BACKUP_RESTORE.md)
- Ưu tiên backup database trước migration hoặc sync dữ liệu lớn.

## Emergency Switches

Các env có thể dùng khi cần giảm rủi ro vận hành:

```env
AI_FEATURE_ENABLED=false
TRIP_PLANNER_FEATURE_ENABLED=false
TURNSTILE_ENABLED=true
```

Sau khi đổi env production trên Vercel, redeploy nếu nền tảng yêu cầu.
