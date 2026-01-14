# Production Readiness Audit Prompt

Use this mega-prompt to audit any application for production readiness. Copy and paste to an AI assistant or use as a checklist for manual review.

---

## The Prompt

```
You are a Principal Software Architect and Security Engineer with 15+ years of experience. Your task is to perform a comprehensive production readiness audit of this application against enterprise-grade standards.

Evaluate the application across ALL the following dimensions. Be direct, critical, and practical. Assume this app will face skilled attackers and production-level traffic.

═══════════════════════════════════════════════════════════════════════════════
1. AUTHENTICATION & SESSION SECURITY
═══════════════════════════════════════════════════════════════════════════════

□ Password Security
  - Passwords hashed with bcrypt (12+ rounds) or Argon2
  - Strong password policy enforced (8+ chars, uppercase, lowercase, number)
  - No plaintext passwords in logs, errors, or responses
  - Password reset tokens are single-use and time-limited

□ Session Management  
  - Sessions stored server-side (database/Redis, NOT client cookies)
  - Session cookies: httpOnly=true, secure=true, sameSite=strict/lax
  - Session regeneration on login (prevents session fixation)
  - Session timeout implemented (idle and absolute)
  - Logout properly destroys session server-side

□ Rate Limiting
  - Login attempts limited (e.g., 5/hour per IP/user)
  - Registration limited (e.g., 10/15min per IP)
  - API endpoints protected from abuse
  - Rate limit headers returned (X-RateLimit-*)

□ CSRF Protection
  - CSRF tokens required for state-changing requests
  - Tokens validated server-side
  - Safe methods (GET, HEAD, OPTIONS) excluded
  - Webhook/callback endpoints excluded appropriately

═══════════════════════════════════════════════════════════════════════════════
2. AUTHORIZATION & ACCESS CONTROL
═══════════════════════════════════════════════════════════════════════════════

□ IDOR (Insecure Direct Object Reference) Protection
  - Ownership checks on all resource access
  - Users cannot access other users' data by changing IDs
  - Admin routes protected by role verification

□ Role-Based Access Control
  - Admin middleware validates admin status
  - Sensitive operations require elevated privileges
  - Role checks happen server-side, not client-side

□ Privilege Escalation Prevention
  - Users cannot modify their own roles
  - Role assignment requires admin privileges
  - Token/session cannot be manipulated to gain access

═══════════════════════════════════════════════════════════════════════════════
3. DATA PROTECTION & TRANSPORT SECURITY
═══════════════════════════════════════════════════════════════════════════════

□ HTTPS & TLS
  - All traffic forced to HTTPS in production
  - TLS 1.2+ enforced
  - HSTS header enabled with reasonable max-age
  - No mixed content (HTTP resources on HTTPS pages)

□ Security Headers (Helmet.js or equivalent)
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY or SAMEORIGIN
  - X-XSS-Protection
  - Referrer-Policy
  - Permissions-Policy

□ Secrets Management
  - No hardcoded secrets in code
  - Environment variables for all credentials
  - Secrets not logged or exposed in errors
  - Different secrets per environment

□ PII Handling
  - Sensitive data sanitized in logs (email, phone, passwords)
  - Personal data encrypted at rest (if required by compliance)
  - Data retention policies implemented

□ File Upload Security
  - File type validation (whitelist allowed types)
  - File size limits enforced
  - Path traversal prevention (sanitize filenames)
  - Files stored outside web root or in object storage
  - Malware scanning for high-risk applications

═══════════════════════════════════════════════════════════════════════════════
4. INPUT VALIDATION & INJECTION PREVENTION
═══════════════════════════════════════════════════════════════════════════════

□ SQL Injection Prevention
  - Parameterized queries or ORM used exclusively
  - No raw SQL with user input concatenation
  - Database user has minimal required permissions

□ XSS Prevention
  - User input escaped/sanitized before rendering
  - React/Vue auto-escaping utilized
  - Content-Security-Policy headers set
  - No dangerouslySetInnerHTML with user content

□ Input Validation
  - Schema validation on all API inputs (Zod, Joi, etc.)
  - Type checking enforced
  - Length limits on all text fields
  - Enum values validated against allowed list

□ SSRF Prevention
  - URL inputs validated and whitelisted
  - Internal network access blocked from user-supplied URLs
  - DNS rebinding protection

═══════════════════════════════════════════════════════════════════════════════
5. PAYMENT & FINANCIAL SECURITY (If Applicable)
═══════════════════════════════════════════════════════════════════════════════

□ Webhook/Callback Security
  - Signature/hash verification on all payment callbacks
  - Callbacks verified against payment gateway (poll URL check)
  - CSRF protection excluded for server-to-server callbacks
  - IP whitelisting if supported by gateway

□ Idempotency & Double-Charge Prevention
  - Transaction IDs tracked in database
  - Duplicate callbacks detected and ignored
  - Order status checked before processing payment
  - Database transaction wraps payment confirmation

□ Amount Verification
  - Expected amount locked at order creation
  - Callback amount verified against expected (with tolerance)
  - Exchange rates locked at order time
  - Amount manipulation attacks prevented

□ PCI Compliance
  - Card data never touches your servers (use tokenization)
  - Payment forms served from payment provider
  - No logging of card numbers or CVV

═══════════════════════════════════════════════════════════════════════════════
6. DATABASE & DATA LAYER
═══════════════════════════════════════════════════════════════════════════════

□ Connection Management
  - Connection pooling configured (max, idle timeout, connection timeout)
  - Pool error handling implemented
  - Connections properly released after use

□ Query Performance
  - Indexes on frequently queried columns
  - N+1 queries eliminated (batch loading)
  - Query logging enabled in development
  - Slow query monitoring in production

□ Data Integrity
  - Foreign key constraints enforced
  - Transactions used for multi-step operations
  - Unique constraints on appropriate fields
  - Cascade deletes configured appropriately

□ Migrations
  - Schema changes use migrations (not manual SQL)
  - Migrations are reversible
  - No destructive changes to primary keys
  - Migration history tracked

═══════════════════════════════════════════════════════════════════════════════
7. SCALABILITY & PERFORMANCE
═══════════════════════════════════════════════════════════════════════════════

□ Statelessness
  - Sessions stored externally (not in-memory)
  - File uploads go to object storage
  - No local filesystem dependencies for state

□ Caching
  - Cache strategy implemented (Redis, Memcached, or CDN)
  - Cache invalidation on mutations
  - Cache TTL configured appropriately
  - Cache warming for critical data

□ Horizontal Scaling Readiness
  - No in-memory state that can't be shared
  - Sticky sessions not required (or handled by load balancer)
  - Background jobs use external queue (not setTimeout)

□ Async Processing
  - Long-running tasks use job queues
  - Webhook processing is async
  - Email/notification sending is async
  - Timeouts configured for external API calls

═══════════════════════════════════════════════════════════════════════════════
8. ERROR HANDLING & MONITORING
═══════════════════════════════════════════════════════════════════════════════

□ Error Handling
  - Global error handler catches unhandled exceptions
  - Errors logged with context (user, request, stack trace)
  - User-facing errors are friendly (no stack traces)
  - Different error responses for 4xx vs 5xx

□ Logging
  - Structured logging (JSON format)
  - Log levels used appropriately (debug, info, warn, error)
  - PII sanitized from logs
  - Request correlation IDs for tracing

□ Health Checks
  - /health or /api/health endpoint exists
  - Database connectivity verified
  - External service dependencies checked
  - Returns appropriate status codes

□ Monitoring & Alerting
  - Error tracking service configured (Sentry, etc.)
  - Payment failure alerts set up
  - Uptime monitoring enabled
  - Performance metrics tracked

═══════════════════════════════════════════════════════════════════════════════
9. CODE QUALITY & MAINTAINABILITY
═══════════════════════════════════════════════════════════════════════════════

□ Code Structure
  - Clear separation of concerns
  - Modular architecture (routes, services, storage)
  - Consistent naming conventions
  - No dead code or commented-out blocks

□ Type Safety
  - TypeScript or equivalent type system used
  - API contracts typed (request/response schemas)
  - No `any` types without justification

□ Testing
  - Unit tests for business logic
  - Integration tests for API endpoints
  - E2E tests for critical user flows
  - Tests run in CI pipeline

□ Documentation
  - README with setup instructions
  - API documentation (OpenAPI/Swagger)
  - Architecture decisions documented
  - Environment variables documented

═══════════════════════════════════════════════════════════════════════════════
10. DEPLOYMENT & OPERATIONS
═══════════════════════════════════════════════════════════════════════════════

□ Environment Configuration
  - Separate configs for dev/staging/production
  - Secrets never committed to version control
  - Environment-specific feature flags

□ Database Operations
  - Backup strategy configured
  - Point-in-time recovery available
  - Backup restoration tested

□ CI/CD
  - Automated testing on pull requests
  - Automated deployment pipeline
  - Rollback capability

═══════════════════════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════════════════════

After your audit, provide:

1. SCORES (1-10) for each category:
   - Authentication & Sessions
   - Authorization & Access Control
   - Data Protection & Transport
   - Input Validation & Injection Prevention
   - Payment Security (if applicable)
   - Database & Data Layer
   - Scalability & Performance
   - Error Handling & Monitoring
   - Code Quality & Maintainability
   - Deployment & Operations

2. OVERALL PRODUCTION READINESS: YES / NO / CONDITIONAL

3. CRITICAL ISSUES (must fix before launch)

4. HIGH-PRIORITY ISSUES (fix within 30 days)

5. RECOMMENDED IMPROVEMENTS (nice to have)

6. CAPACITY ESTIMATE:
   - Max concurrent users
   - Max daily active users
   - Max requests per second

7. 90-DAY ROADMAP prioritized by impact
```

---

## Quick Checklist Version

For faster reviews, use this condensed checklist:

### Security Essentials
- [ ] bcrypt password hashing (12+ rounds)
- [ ] Session stored in database, httpOnly/secure cookies
- [ ] Session regeneration on login
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection with exclusions for webhooks
- [ ] IDOR protection (ownership checks)
- [ ] Helmet.js security headers
- [ ] Input validation with Zod/Joi
- [ ] Parameterized queries (no raw SQL)

### Payment Security (if applicable)
- [ ] Webhook signature verification
- [ ] Idempotency (track processed transactions)
- [ ] Amount verification (lock at order creation)
- [ ] Poll URL verification for callbacks

### Database
- [ ] Connection pooling configured
- [ ] Performance indexes created
- [ ] N+1 queries eliminated
- [ ] Transactions for multi-step operations

### Scalability
- [ ] External session storage
- [ ] External cache (Redis) for multi-instance
- [ ] Background job queue for async tasks
- [ ] Health check endpoint

### Operations
- [ ] Structured logging with PII sanitization
- [ ] Error tracking configured
- [ ] Database backups enabled
- [ ] Secrets in environment variables

---

## Capacity Planning Formula

```
Max Concurrent DB Connections = Pool Size (e.g., 20)
Avg Query Time = 50-100ms
Max Requests/Second = Pool Size / Avg Query Time = 200-400 req/s

Assume 1 request per user per 30-60 seconds:
Max Concurrent Users = Requests/Second × 30-60 = 6,000-24,000

Conservative Daily Active Users = Max Concurrent / 10 = 600-2,400
Peak Daily Active Users = Max Concurrent / 3 = 2,000-8,000
```

### Scaling Thresholds

| DAU Range | Infrastructure Needed |
|-----------|----------------------|
| < 5,000 | Single instance, PostgreSQL |
| 5,000-20,000 | Add Redis cache, job queue |
| 20,000-100,000 | Multiple instances, read replicas |
| > 100,000 | Microservices, dedicated DB clusters |

---

## Standards Referenced

This audit prompt aligns with:
- OWASP Top 10 (2021)
- PCI DSS v4.0 (payment security)
- NIST Cybersecurity Framework
- SOC 2 Type II controls
- GDPR data protection requirements
- ISO 27001 security controls

---

## Usage

1. **New Projects**: Run this audit before launch
2. **Existing Projects**: Run quarterly or after major changes
3. **Security Reviews**: Focus on sections 1-5
4. **Performance Reviews**: Focus on sections 6-7
5. **Code Reviews**: Focus on section 9

Keep this document updated as standards evolve.
