# Secrets Management & Rotation Playbook

This document details the list of credentials used by Vivu and instructions for rotating them securely in case of exposure.

## 1. Secrets Inventory

- `DATABASE_URL` / `DIRECT_DATABASE_URL`: Prisma connection strings to Neon PostgreSQL.
- `JWT_ACCESS_SECRET`: Signature key for short-lived JWT access tokens.
- `JWT_REFRESH_SECRET`: Reserved refresh-token secret/config value. Current refresh tokens are random values stored in the database as hashes.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: AWS credentials for S3 media storage.
- `GEMINI_API_KEY`: API key for Gemini LLM query processing.
- `QDRANT_URL` / `QDRANT_API_KEY`: Connection details for Qdrant Vector database.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`: Keys for Cloudflare Turnstile spam protection.

## 2. Secrets Rotation Playbook

### Scenario A: Gemini API Key Leak

1. Generate a new API Key in the Google AI Studio console.
2. Update the `GEMINI_API_KEY` environment variable in Vercel.
3. Redeploy the API project to apply changes.
4. Revoke/delete the compromised API key from Google AI Studio.

### Scenario B: AWS Access Key Leak

1. Create a new access key for the IAM user in AWS Console.
2. Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in Vercel settings.
3. Redeploy the API service.
4. Deactivate and delete the leaked credentials from IAM settings.

### Scenario C: JWT Access Secret Leak

1. Generate a new cryptographically strong random string (e.g., using `openssl rand -base64 32`).
2. Update `JWT_ACCESS_SECRET` in the API configuration.
3. Redeploy the API project.
4. _Impact_: This will invalidate all active sessions immediately, forcing users to log in again.
5. Revoke active refresh tokens if you suspect full account/session compromise.

### Scenario D: Refresh Token Store or Refresh Secret Leak

1. Rotate `JWT_REFRESH_SECRET` if it is used by deployment checks or future refresh-token signing.
2. Revoke all rows in the refresh token table or force users to log in again.
3. Redeploy the API project and verify `/api/auth/refresh` behavior.

### Scenario E: Database URL Leak

1. Reset the connection credentials/password in Neon console.
2. Update `DATABASE_URL` and `DIRECT_DATABASE_URL` settings in Vercel.
3. Redeploy the services.
4. Verify connections are operational.

## 3. General Principles

- **No Git commits**: Never commit `.env` or plain-text secrets to the repository.
- **Environment Isolation**: Maintain separate values for Development, Staging/Preview, and Production environments.
- **Least Privilege**: Ensure IAM roles and API keys are scoped with minimal necessary permissions.
