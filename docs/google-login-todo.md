# Google Sign-In TODO

Goal: add Google sign-in to Vivu's existing first-party auth without moving the
user database out of Neon/PostgreSQL.

Recommended backend-owned flow:

1. Add `GET /api/v1/auth/google` to start Google OAuth/OIDC.
2. Add `GET /api/v1/auth/google/callback` to verify the Google response.
3. Use Google email as the linking key.
4. If the email already exists in `User`, link the Google account to that user.
5. If the email is new, create a `User` with role `user`.
6. Never override an existing `editor` or `admin` role during linking.
7. Issue the same Vivu JWT access token and refresh token used by password login.
8. Keep `/api/auth/*` Next.js route handlers as the frontend session bridge.

Expected env when this follow-up is implemented:

```env
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

Do not implement this as part of the rollback unless the auth rollback is already
stable and fully tested.
