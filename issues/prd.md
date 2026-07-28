# PRD: JWT-Based Authentication

> Historical design document for issue #001. The migration is complete. Current cookie and CSRF behavior is documented in [issue #005](005-production-authentication-hardening.md) and the [JWT setup guide](jwt-setup-guide.md); those documents supersede older security assumptions below.

## Problem Statement

StockSprout currently uses session-based authentication (HttpSession with cookies). When the server restarts, all active sessions are lost and users must log in again. The application will be deployed on a free hosting service with unreliable uptime and frequent restarts, causing users to be repeatedly logged out. This creates a poor user experience and makes the application difficult to use.

## Solution

Replace session-based authentication with JWT (JSON Web Token) authentication. JWTs are stateless - the server validates tokens cryptographically without needing to store session state. This means tokens remain valid across server restarts, allowing users to stay logged in regardless of server uptime.

The solution uses a two-token pattern:
- **Access Token**: Short-lived (1 hour), used for API calls, carried in a cookie
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens, stored in database for revocation

This balances security (short-lived access tokens) with user experience (long-lived refresh tokens for seamless re-authentication).

## User Stories

1. As a user, I want to log in with my email and password, so that I can access my portfolio and trading features.

2. As a user, I want to stay logged in even when the server restarts, so that I don't have to repeatedly enter my credentials.

3. As a user, I want my authentication to remain valid for at least 7 days of activity, so that I can use the app without frequent re-login.

4. As a user, I want to be able to log out, so that my account is secured on shared devices.

5. As a user, I want my session to expire after a period of inactivity (7 days), so that my account is protected if I forget to log out.

6. As an administrator, I want to be able to revoke a user's refresh token on logout, so that logged-out users cannot continue making API calls.

7. As a developer, I want authentication to work via cookies (not manual Authorization headers), so that browser-based clients work seamlessly.

8. As a developer, I want JWT signing secrets to be stored in environment variables, so that secrets are not committed to the repository.

9. As a developer, I want clear error responses when authentication fails, so that the frontend can handle redirects appropriately.

10. As a developer, I want existing session-based code to be cleanly replaced (not layered), so that the codebase remains maintainable.

11. As a developer, I want unit tests for core JWT logic, so that token generation and validation can be verified independently.

12. As a developer, I want refresh tokens to be stored hashed in the database, so that a database compromise doesn't expose all active tokens.

13. As a user, I want the login flow to feel the same as before, so that I don't need to learn new interactions.

14. As a developer, I want the migration to be a hard cut (not gradual), so that we don't maintain dual authentication systems.

15. As a developer, I want a rollback plan (git revert), so that we can recover quickly if deployment issues arise.

## Implementation Decisions

### Architecture

**JWT Pattern**: Access token (1 hour) + Refresh token (7 days, static rotation)
**Token Storage**: Both tokens stored in host-only, HTTP-only cookies
**Refresh Token Persistence**: PostgreSQL database table
**Secret Management**: Environment variable `JWT_SECRET`
**Migration Strategy**: Hard cut - deploy JWT, all existing sessions invalidated, users log in again

### Modules to Build

**1. JWT Service** (Deep Module, new)
- Generates signed access tokens containing user claims (email, user ID, role, issued at, expires at)
- Validates token signatures and expiration
- Extracts claims (user ID, email, role) from valid tokens
- Uses jjwt library for cryptographic operations
- Testable in isolation without Spring or database

**2. Refresh Token Service** (Deep Module, new)
- Creates refresh tokens and stores them hashed in the database
- Validates refresh tokens by checking database presence and expiration
- Revokes refresh tokens on logout by marking them as revoked
- Cleans up expired/revoked tokens via scheduled job
- Uses SHA-256 hashing for token storage

**3. JWT Authentication Filter** (New)
- Intercepts incoming HTTP requests
- Extracts access token from cookie
- Delegates validation to JWT Service
- Sets Spring Security authentication context if valid
- Returns 401 if token is missing, invalid, or expired

**4. Auth Controller** (Modified from existing LoginController)
- Login endpoint: Validates credentials, creates both tokens as cookies
- Refresh endpoint: Validates refresh token cookie, issues new access token cookie
- Logout endpoint: Revokes refresh token in database, clears cookies
- "Me" endpoint: Returns current user from access token

**5. Refresh Token Entity & Repository** (New)
- JPA entity mapping to refresh_tokens table
- Fields: id, user_id, token_hash, expires_at, created_at, revoked_at
- Spring Data repository for database operations
- Auto-generated by Hibernate (ddl-auto=update)

**6. CSRF Protection** (Added during production hardening)
- Issues a separate, JavaScript-readable `XSRF-TOKEN` cookie
- Requires the matching token in `X-XSRF-TOKEN` for unsafe HTTP methods
- Keeps both JWT cookies inaccessible to JavaScript

### Database Schema

**New table: refresh_tokens**
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT NOT NULL (foreign key to appuser)
- token_hash: VARCHAR(255) UNIQUE NOT NULL (SHA-256 hash)
- expires_at: TIMESTAMP NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- revoked_at: TIMESTAMP NULL

**Indexes:** user_id (for lookup), expires_at (for cleanup queries)

### API Contract Changes

**New/Modified Endpoints:**
- `POST /api/auth/login` (was /api/login) - Sets both access and refresh cookies
- `POST /api/auth/refresh` (new) - Takes refresh cookie, returns new access cookie
- `POST /api/auth/logout` (was /api/login/logout) - Revokes refresh token, clears cookies
- `GET /api/auth/me` (was /api/login/me) - Returns user from access token

**Response Status Codes:**
- 200: Success (login, refresh, logout, me)
- 401: Unauthorized (invalid/expired tokens, no token provided)
- No response body for errors - frontend handles 401 uniformly

### Frontend Changes

**Files to modify:**
- AuthContext.jsx: Update endpoint from /api/login/me to /api/auth/me
- LoginPage.jsx: Handle JWT response (cookies set automatically)
- SignupPage.jsx: Handle JWT response (cookies set automatically)

**Shared request behavior:**
- `credentials: 'include'` remains for cookie support
- Token storage is handled by the browser automatically
- A central API helper adds the CSRF header to unsafe requests

### Dependencies

**New Maven dependencies:**
- io.jsonwebtoken:jjwt-api (0.12.6)
- io.jsonwebtoken:jjwt-impl (0.12.6, runtime)
- io.jsonwebtoken:jjwt-jackson (0.12.6, runtime)

### Security Configuration

**Cookie settings:**
- Access token: HTTP-only, environment-aware Secure flag, SameSite=Lax, path `/api`
- Refresh token: HTTP-only, environment-aware Secure flag, SameSite=Lax, path `/api/auth`
- CSRF token: JavaScript-readable, SameSite=Lax, path `/`

**JWT secret:**
- Minimum 256 bits
- Stored in JWT_SECRET environment variable
- Local development: application-local.properties (gitignored)

### Error Handling

All authentication failures return HTTP 401 with no body:
- Access token expired
- Access token invalid (signature failure)
- No access token provided
- Refresh token expired
- Refresh token not found (revoked)
- Refresh token invalid

Frontend: On 401, attempt refresh via /api/auth/refresh. If refresh fails, redirect to login.

## Testing Decisions

**What makes a good test:**
Tests verify external behavior through public interfaces, not implementation details. A good test for JWT logic should verify that valid tokens pass validation and invalid/expired tokens fail, without inspecting internal cryptographic operations.

**Modules with tests:**

**JWT Service** (High priority)
- Verify token generation produces valid JWT with correct claims
- Verify token validation accepts valid tokens
- Verify token validation rejects expired tokens
- Verify token validation rejects tampered tokens (wrong signature)
- Verify claim extraction returns correct values
- Tests use fixed clock/fake time for expiration testing

**Refresh Token Service** (High priority)
- Verify refresh token creation stores hashed token in database
- Verify refresh token validation accepts valid unexpired tokens
- Verify refresh token validation rejects expired tokens
- Verify refresh token validation rejects revoked tokens
- Verify refresh token validation rejects unknown tokens
- Verify revocation marks token as revoked in database
- Verify cleanup removes expired/revoked tokens
- Tests mock repository layer

**Auth Controller** (Automated integration testing)
- Verify login sets both cookies
- Verify refresh endpoint issues new access cookie
- Verify logout clears cookies and revokes token
- Verify 401 returned for missing/invalid tokens
- Verified via browser dev tools and API client

**Prior art:** Existing codebase has limited test coverage. New tests will follow standard Spring Boot testing patterns (JUnit 5, Mockito, @WebMvcTest for controllers).

## Out of Scope

The following are explicitly out of scope for this PRD:

- **Password reset functionality**: Users forgetting passwords will need account creation or manual reset for now. Can be added as a separate feature.

- **Email verification**: Signup remains auto-enabled without email confirmation.

- **Remember me functionality**: Covered by 7-day refresh token expiration.

- **Multi-device/session management**: No UI to show active sessions or revoke specific devices.

- **Rate limiting**: Login attempts are not rate-limited (future security enhancement).

- **CSRF protection**: Implemented later as part of production authentication hardening.

- **Role-based access control**: Admin role exists in data model but not enforced in API endpoints.

- **Token rotation on refresh**: Static refresh token approach (no new token issued on refresh use).

- **Access token blacklist**: Revocation handled through 1-hour maximum lifetime.

- **Gradual migration**: Hard cut strategy, no dual authentication system support.

- **Redis integration**: Refresh tokens stored in PostgreSQL, not external cache.

- **Mobile client support**: Design focused on web browser cookie handling.

## Further Notes

**Why JWT over sessions for this use case:**
The free hosting server has unreliable uptime. Sessions stored in memory are lost on restart, forcing users to log in repeatedly. JWT tokens are validated cryptographically without server-side state, surviving restarts seamlessly.

**Why static refresh tokens (no rotation):**
Simpler implementation. If a refresh token is compromised, the attacker has access until the user logs out or 7 days elapse. Rotation adds complexity (token invalidation on use) that can be added later if security requirements demand it.

**Why cookies over Authorization headers:**
Simpler frontend implementation. Browser handles cookie transmission automatically. React components don't need to manage token storage or add headers manually.

**Why 1-hour access token expiration:**
Balance between security and UX. Short enough to limit damage if stolen, long enough to avoid excessive refresh calls during active usage.

**Why 7-day refresh token expiration:**
Users expect to stay logged in for about a week. Can be adjusted based on user feedback.

**Rollback plan:**
If JWT deployment causes issues, revert to pre-JWT commit. All active JWT users will need to log in again with sessions. This is acceptable as the app is not yet in production.

**Environment variable concern:**
Completed in issue #003. Tracked configuration now uses environment placeholders and safe examples.

**JWT secret generation:**
For production, generate a cryptographically random 256+ bit secret. Example: `openssl rand -base64 32`

**Database migration:**
Refresh tokens table auto-created by Hibernate. For production, consider Flyway migrations for version-controlled schema changes.

**Frontend backward compatibility:**
Old session-based API endpoints will no longer exist. Ensure all frontend code is updated before deploying backend changes.
