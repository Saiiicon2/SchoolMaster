# External Auth & Deployment Notes

This document describes external OIDC authentication and deployment notes for the SchoolMaster project.

## Authentication

- **Provider**: External OIDC provider (configurable via `AUTH_DOMAINS` and `ISSUER_URL`)
- **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Authorization**: Role-based access control (`admin`, `teacher`, `student`)
- **Security**: HTTP-only cookies with secure session handling

## Usage

- To enable external OIDC authentication, set `AUTH_DOMAINS` and `ISSUER_URL` in your environment.
- For local development the project uses `local` session-based authentication.

## Deployment

Refer to the implementation guide for deployment details and environment configuration.
