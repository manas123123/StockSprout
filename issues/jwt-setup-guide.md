# JWT Authentication Setup Guide

## Required Configuration

JWT authentication requires a private signing key supplied through `JWT_SECRET`. Use at least 32 random bytes for the HS256 algorithm.

Generate a key with either command:

```powershell
openssl rand -base64 32
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Treat the generated output like a password. Do not paste it into a tracked file, documentation, frontend variable, or chat message.

## Local Development

The recommended local approach is:

1. Copy `backend/stocksprout/config/application.properties.example` to `backend/stocksprout/config/application.properties`.
2. Replace the JWT placeholder in the copied file.
3. Keep the copied file private. It is ignored by Git and remains outside the application artifact.

You can instead set `JWT_SECRET` in the terminal that starts Maven.

PowerShell syntax:

```powershell
$env:JWT_SECRET="<generated-value>"
```

That setting applies only to the current PowerShell process and programs started from it. Spring Boot does not automatically load a repository `.env` file.

## Hosted Environments

Set `JWT_SECRET` through the hosting platform's environment or secret settings. The application code and tracked properties file remain unchanged.

Use a separate signing key for every environment. Rotating the key invalidates existing access tokens and requires users to authenticate again.

Hosted HTTPS environments must also set:

```text
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=Lax
```

The supported topology serves the frontend and `/api` through the same public origin. Keep `VITE_API_BASE_URL` blank and route `/api` to the backend through the selected hosting platform or reverse proxy.

## Optional Token Lifetimes

| Environment variable | Default | Purpose |
|---|---:|---|
| `JWT_ACCESS_TOKEN_EXPIRATION` | `3600000` | Access-token lifetime in milliseconds |
| `JWT_REFRESH_TOKEN_EXPIRATION` | `604800000` | Refresh-token lifetime in milliseconds |

## Authentication Endpoints

- `GET /api/auth/csrf` creates the separate CSRF cookie used by the frontend.
- `POST /api/auth/login` creates access and refresh cookies.
- `POST /api/auth/refresh` creates a new access cookie from a valid refresh cookie.
- `POST /api/auth/logout` revokes the refresh token and clears the cookies.
- `GET /api/auth/me` returns the authenticated user.

## Cookie and CSRF Behavior

- Access and refresh JWT cookies are host-only, `HttpOnly`, and `SameSite=Lax`.
- The access cookie is limited to `/api`; the refresh cookie is limited to `/api/auth`.
- Local HTTP uses `AUTH_COOKIE_SECURE=false`. Hosted HTTPS must use `AUTH_COOKIE_SECURE=true`.
- JavaScript cannot read either JWT.
- The non-secret `XSRF-TOKEN` cookie is readable by the frontend. The shared API helper copies it to `X-XSRF-TOKEN` for every POST, PUT, PATCH, and DELETE request.
- Spring Security rejects unsafe requests when the CSRF cookie and header are absent or do not match.

## Security Notes

- Never commit a real signing key.
- Never use a `VITE_` variable for a signing key; Vite variables are visible in browser code.
- Use different keys for local, staging, and production environments.
- Treat any key previously committed to Git as compromised and rotate it.
- Removing a key from the current file does not remove it from Git history or existing clones.
