# Backup and Disaster Recovery Plan

This guide outlines recovery steps for database failure, storage loss, and security breaches.

## 1. Neon Database Backups

- **Automatic Backups**: Neon performs automatic backups hourly/daily depending on your plan.
- **Manual Backups (pg_dump)**:
  ```bash
  pg_dump -h ep-raspy-dust-ao0o5jfn-pooler.c-2.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -F c -b -v -f vivu_backup.dump
  ```
- **Restore**:
  ```bash
  pg_restore -h ep-raspy-dust-ao0o5jfn-pooler.c-2.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -v vivu_backup.dump
  ```

## 2. AWS S3 Storage versioning

- Enable **Bucket Versioning** in the AWS console for `gia-lai-tourism-images` to prevent accidental deletions.
- Keep a local mirror of critical media files.

## 3. Qdrant Cloud Recovery

If the Qdrant Cloud collection gets corrupted or deleted, rebuild it from PostgreSQL metadata:

- Command: `pnpm --filter @vivu/api reindex:meili` (if configured to push to Qdrant) or execute your local Qdrant pipeline script.

## 4. Emergency Secret Rotation

If a secret is leaked, update it immediately in the **Vercel Project Settings**:

1. **Gemini Key Leaked**: Rotate GCP API Key, set new `GEMINI_API_KEY`.
2. **AWS Keys Leaked**: Deactivate access key in IAM console, generate new `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
3. **Database URL Leaked**: Reset the password in the Neon console immediately.
