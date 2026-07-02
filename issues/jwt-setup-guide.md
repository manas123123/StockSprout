# JWT Authentication Setup Guide

## Environment Variables

The JWT authentication system requires one environment variable to be set:

### JWT_SECRET

A cryptographically random secret key used to sign and verify JWT tokens. Must be at least 256 bits (32 bytes) for HS256 algorithm.

#### Generating a Secret

**Using OpenSSL (recommended):**
```bash
openssl rand -base64 32
```

**Using Python:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

#### Setting the Environment Variable

**Windows (Command Prompt):**
```cmd
set JWT_SECRET=your-generated-secret-here
```

**Windows (PowerShell):**
```powershell
$env:JWT_SECRET="your-generated-secret-here"
```

**Linux/Mac (bash/zsh):**
```bash
export JWT_SECRET="your-generated-secret-here"
```

#### For Production Deployment

Set this in your hosting platform's environment variable configuration:
- **Render:** Dashboard → Environment
- **Railway:** Variables tab
- **Fly.io:** `flyctl secrets set JWT_SECRET=...`
- **Docker:** `-e JWT_SECRET=...` or docker-compose env file

## Configuration Values (Optional)

These are set in `application.properties` with defaults:

| Property | Default | Description |
|----------|---------|-------------|
| `jwt.access-token-expiration` | `3600000` (1 hour) | Access token lifetime in milliseconds |
| `jwt.refresh-token-expiration` | `604800000` (7 days) | Refresh token lifetime in milliseconds |

## Verification

After setting up, start the application and verify:

1. **Login test:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}' \
     -c cookies.txt
   ```

2. **Check cookies were set:**
   ```bash
   cat cookies.txt
   # Should show access_token and refresh_token
   ```

3. **Test /me endpoint:**
   ```bash
   curl http://localhost:8080/api/auth/me -b cookies.txt
   # Should return user data
   ```

## Security Notes

- **Never commit JWT_SECRET to version control**
- **Use different secrets for dev/staging/production**
- **Rotate the secret periodically** (requires all users to re-login)
- **Keep secret length ≥256 bits** for HS256 security

## Database

The `refresh_tokens` table is auto-created by Hibernate. No manual migration needed for local development.
