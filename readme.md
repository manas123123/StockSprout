# VAMPZ - Stock Market Simulator

*A stock market simulation platform for users to trade, track, and analyze portfolios without financial risk.*

## Table of Contents

- [Motivation](#motivation)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Configuration Model](#configuration-model)
- [Local Setup](#local-setup)
- [Running the Application](#running-the-application)
- [JWT Authentication](#jwt-authentication)
- [Contribution Guidelines](#contribution-guidelines)
- [Troubleshooting](#troubleshooting)

## Motivation

VAMPZ provides a safe environment for learning how stock trading and portfolio management work. It combines a Spring Boot API, PostgreSQL persistence, and a React interface.

## Features

- User registration, login, and profile management
- JWT authentication with database-backed refresh tokens
- Stock data, charts, and watchlists
- Portfolio tracking and analytics
- Paper-money stock trades

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.4.10, Spring Data JPA, Spring Security
- **Frontend:** React, Vite, Tailwind CSS
- **Database:** PostgreSQL
- **Authentication:** JWT access and refresh tokens stored in cookies
- **Build tools:** Maven and npm

## Configuration Model

StockSprout keeps environment-specific values outside the source code. The same repository can therefore run locally or on a hosting platform without code changes.

The tracked backend configuration reads these environment variables:

| Variable | Required | Purpose |
|---|---:|---|
| `DB_URL` | Yes | PostgreSQL JDBC connection URL |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | Private JWT signing key, at least 32 bytes |
| `MARKET_DATA_API_KEY` | Yes | Financial Modeling Prep API key |
| `PORT` | No | Backend HTTP port; defaults to `8080` |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated frontend origins; defaults to `http://localhost:5173` |
| `JPA_DDL_AUTO` | No | Hibernate schema behavior; defaults to `update` for local development |
| `JPA_SHOW_SQL` | No | SQL logging; defaults to `false` |

For local development, use the ignored external properties file described below. A hosting platform should provide the same values through its environment or secret settings.

Spring Boot does not automatically load a repository `.env` file. This project uses Spring Boot's standard environment variables and external property files instead of adding a dotenv dependency.

The frontend has two non-secret build/development variables:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Optional public backend origin; leave blank for same-origin requests |
| `VITE_API_PROXY_TARGET` | Local Vite proxy target; defaults to `http://localhost:8080` |

All `VITE_` values are visible in the browser bundle and must never contain secrets.

Because authentication uses cookies, same-origin production routing is recommended until cross-site cookie and CSRF hardening is completed.

## Local Setup

### Prerequisites

- Java 21
- Maven 3.8 or newer
- Node.js 18 or newer and npm
- PostgreSQL 13 or newer

### 1. Create the local database

```sql
CREATE DATABASE stockdb;
```

### 2. Create private backend configuration

From `backend/stocksprout`, copy the safe example:

```powershell
Copy-Item config/application.properties.example config/application.properties
```

Open `config/application.properties` and replace every placeholder with your own local values. This copied file is ignored by Git and remains outside the packaged application.

Generate a JWT signing key with either command:

```powershell
openssl rand -base64 32
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Do not paste the generated value into a tracked file.

### 3. Configure the frontend if needed

The default setup expects the backend on port 8080, so no frontend configuration is required. To create local frontend overrides:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

For example, if the backend runs on port 8081, change only `VITE_API_PROXY_TARGET` in the ignored `frontend/.env.local` file. Vite loads `.env.local` automatically.

## Running the Application

Start the backend from `backend/stocksprout`:

```powershell
mvn spring-boot:run
```

Start the frontend from `frontend` in a second terminal:

```powershell
npm install
npm run dev
```

Then open `http://localhost:5173`. Requests beginning with `/api` are sent through the Vite development proxy to the configured backend target.

To check the unauthenticated backend response:

```powershell
curl http://localhost:8080/api/auth/me
```

A `401 Unauthorized` response is expected before login.

## JWT Authentication

StockSprout uses two tokens:

- The access token is short-lived and authenticates API requests.
- The refresh token is longer-lived, stored in PostgreSQL as a hash, and obtains a new access token.

Authentication endpoints:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

See [the JWT setup guide](issues/jwt-setup-guide.md) for additional details.

## Security Notes

- Never commit database credentials, JWT signing keys, market-data keys, or populated local configuration files.
- Use different credentials for local, staging, and production environments.
- Values previously committed to Git must be treated as compromised and rotated.
- Removing a value from the latest commit does not remove it from Git history or existing clones.
- Rewriting shared Git history is a separate, coordinated operation; credential rotation is still required afterward.

## Contribution Guidelines

- Feature branches should follow the `feature/<feature-name>` convention.
- Use GitHub Issues to track work.
- Submit changes through pull requests for review.
- Follow Java and JavaScript best practices.

## Troubleshooting

### Port 8080 is already in use

Set a different backend port in the ignored `backend/stocksprout/config/application.properties`, then set the matching `VITE_API_PROXY_TARGET` in `frontend/.env.local`.

### Database connection failed

- Confirm PostgreSQL is running.
- Confirm `backend/stocksprout/config/application.properties` exists.
- Confirm every placeholder in that ignored file was replaced.
- Confirm the local database exists.

### Frontend API calls failed

- Confirm the backend is running.
- Confirm `VITE_API_PROXY_TARGET` matches the backend port.
- Restart Vite after changing `.env.local`.

## License

[Your License Here]
