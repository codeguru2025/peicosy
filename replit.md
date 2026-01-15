# Peicosy - Luxury E-Commerce Platform

## Overview

Peicosy is a high-end luxury e-commerce platform designed as a "private client" service connecting London's finest luxury goods to elite customers in South Africa. The application features a vibrant light theme with pink primary accents, navy text, and clean white aesthetic. Tagline: "Not for Everyone, Just for You."

The platform includes product browsing, dynamic landed cost calculation, proof of payment uploads, order management, and an admin dashboard for managing products, orders, and viewing analytics.

## Recent Changes (January 2026)

- **Paynow Zimbabwe Payment Integration** (January 2026):
  - Full Paynow payment gateway integration for Zimbabwe market
  - Web checkout (Visa, Mastercard) and mobile money (Ecocash, OneMoney) support
  - GBP to USD currency conversion using database-driven exchange rates
  - Secure callback handling with SHA512 hash validation and poll URL verification
  - Payment status polling endpoint for real-time updates
  - API endpoints: POST /api/payment/paynow/initiate, POST /api/payment/paynow/mobile, GET /api/payment/paynow/status/:orderId
  - Required secrets: PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY
- **Multi-Image Product System** (January 2026):
  - New `product_images` table supporting multiple images per product
  - Image roles: thumbnail, hero, gallery with automatic role management
  - Drag-and-drop image uploader in admin dashboard
  - Replit Object Storage integration for cloud-hosted images
  - OptimizedImage component with lazy loading and intersection observer
  - Migration tool for converting legacy imageUrl fields to new system
  - API endpoints: GET/POST /api/products/:id/images, PATCH/DELETE /api/product-images/:id
- **Security Hardening** (January 2026):
  - Helmet.js middleware with CSP, HSTS, X-Content-Type-Options, X-Frame-Options headers
  - Strengthened password validation: 8+ chars, uppercase, lowercase, and number required
  - OrderStatus/InquiryStatus enums to eliminate magic strings in payment flows
  - Health check endpoint: GET /api/health with DB connectivity, uptime, and memory metrics
  - File upload validation (allowed types: JPEG, PNG, GIF, WebP, PDF)
  - File size limits (10MB max)
  - Path traversal prevention in file names
  - Authentication required for file uploads
  - Admin credentials configurable via ADMIN_USERNAME and ADMIN_PASSWORD env vars
  - IDOR protection: Ownership checks on GET/PATCH /api/orders/:id endpoints
  - Rate limiting: strictAuthLimiter (5 attempts/hour) on login, authLimiter (10/15min) on registration
  - Payment amount verification: Locked exchange rates at order creation (expectedAmountUsd, expectedAmountZar)
  - PayFast/Paynow callbacks verify amounts against locked-in values with 5% tolerance
  - Duplicate payment protection: Idempotent callback handling with `processed_payment_callbacks` table
  - Payment callbacks recorded AFTER successful order updates to prevent lost payments
  - Database connection pooling: max 20, idle timeout 30s, connection timeout 10s
  - N+1 query optimization: Batch loading for order lists reduces queries from O(n) to O(2)
  - PII sanitization: Payment logs mask phone/email data
  - CSRF protection: csrf-sync middleware with token validation on state-changing requests
  - Payment gateway callbacks (/api/payment/payfast/notify, /api/payments/paynow/callback) excluded from CSRF
  - Client auto-refreshes CSRF token on 403/419 errors for seamless session rotation handling
  - Session rotation: Session ID regenerated on login/registration to prevent session fixation attacks
- **Admin Reports & Analytics**: New Reports tab in admin dashboard with:
  - Key business metrics (total revenue, orders, average order value, customer count)
  - Revenue trend chart (12 months)
  - Order status distribution pie chart
  - Top products by revenue
  - Category performance analysis
- **Data Export**: Export all database tables (products, orders, customers, transactions) in CSV or JSON format
- **Admin Authorization**: Added isAdmin middleware for secure admin-only endpoints
- **PWA (Progressive Web App)**: Full PWA support with manifest.json, service worker, and install prompts for mobile devices
- **Splash Screen**: Elegant animated splash screen with Peicosy logo displayed while the app loads
- **Bcrypt Password Security**: Upgraded from SHA-256 to bcrypt (12 salt rounds) for secure password hashing with automatic migration for existing users
- **User Registration**: New /signup page allows users to create accounts with username/password authentication
- **Mobile-First Design**: Enhanced responsive design with optimized breakpoints for mobile devices (h-16 header, smaller logo, touch-friendly buttons)
- **Dynamic Landed Cost Calculator**: Both frontend and backend now use database-driven shipping rates and customs rules
- **Proof of Payment Upload**: Orders page allows users to upload payment proof via object storage
- **Admin Product/Order Management**: Admin dashboard for managing products and orders

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: 
  - TanStack React Query for server state
  - Zustand for client state (shopping cart with persistence)
- **Styling**: Tailwind CSS with custom luxury theme (deep charcoal/midnight navy palette, signature pink accents)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Typography**: Playfair Display (serif headlines) + DM Sans (body text)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Build Tool**: esbuild for server, Vite for client

### Database Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` (shared between client/server)

### Authentication
- **Provider**: Username/password authentication with bcrypt hashing
- **Password Security**: bcrypt with 12 salt rounds
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Session Management**: Express sessions with Passport.js
- **Admin Credentials**: Configurable via ADMIN_USERNAME and ADMIN_PASSWORD environment variables (defaults to "peicosy"/"admin123" if not set - change for production)

### PWA Features
- **Manifest**: client/public/manifest.json with app metadata and icons
- **Service Worker**: client/public/sw.js for offline caching
- **Splash Screen**: client/src/components/SplashScreen.tsx with animated logo
- **Theme Color**: #ec4899 (signature pink)

### Modular Route Architecture (January 2026)
Routes have been decomposed into domain-focused modules for maintainability:
```
server/routes/
├── index.ts          # Barrel export for all route modules
├── auth.ts           # Authentication routes (register, login)
├── products.ts       # Product CRUD with caching
├── orders.ts         # Order management
├── admin.ts          # Admin dashboard, analytics, export
├── shipping.ts       # Shipping rates and exchange rates
├── payments.ts       # PayFast and Paynow payment gateways
└── utils.ts          # Shared utilities (password hashing, logging, auth helpers)
```

### Product Caching Layer
- In-memory Map-based cache with 5-minute TTL
- Caches: product list, single product, productWithImages queries
- Automatic invalidation on product/image mutations
- Cache stats endpoint: GET /api/cache/products/stats
- Hit/miss tracking with hit rate calculation

### Structured Logging
- JSON-formatted logs with level, category, message, and timestamp
- PII sanitization: phone, email, and password fields masked
- Log levels: debug (dev only), info, warn, error
- Centralized error handling with `handleRouteError()`

### File Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (Navigation, Footer, CartDrawer)
│   ├── hooks/           # Custom hooks (use-auth, use-cart, use-products, use-orders)
│   ├── pages/           # Route pages (Home, Shop, Checkout, Orders, AdminDashboard)
│   └── lib/             # Utilities (queryClient, auth-utils)
├── server/              # Express backend
│   ├── routes.ts        # Main route registration (delegates to modules)
│   ├── routes/          # Modular route handlers
│   ├── cache.ts         # Product caching layer
│   ├── storage.ts       # Database operations
│   ├── db.ts            # Database connection
│   └── replit_integrations/  # Auth and object storage
├── shared/              # Shared code
│   ├── schema.ts        # Drizzle database schema
│   ├── routes.ts        # API route type definitions with Zod
│   └── models/          # Data models
└── migrations/          # Database migrations
```

### Design Patterns
- **Mobile-first responsive design** as a hard requirement
- **Type-safe API contracts** using Zod schemas in `shared/routes.ts`
- **Separation of concerns**: Frontend hooks encapsulate data fetching logic
- **Persistent cart**: Zustand with localStorage persistence

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries

### Authentication
- **Replit Auth**: OIDC-based authentication
- Required env vars: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### File Storage
- **Google Cloud Storage**: Object storage via Replit's sidecar service
- **Uppy**: Client-side file upload handling with presigned URLs
- Endpoint: `http://127.0.0.1:1106` (Replit sidecar)

### UI Dependencies
- **Recharts**: Admin dashboard analytics charts
- **Framer Motion**: Smooth animations (listed in requirements)
- **Lucide React**: Icon library

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `zustand`: Client state management
- `wouter`: Lightweight routing
- `zod`: Schema validation
- `drizzle-orm` + `drizzle-kit`: Database ORM
- `express-session` + `passport`: Authentication middleware

## Production Deployment Checklist

### Before Going Live

#### Security
- [x] Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables (don't use defaults)
- [x] Verify all payment secrets are configured: `PAYNOW_INTEGRATION_ID`, `PAYNOW_INTEGRATION_KEY`
- [x] Ensure `SESSION_SECRET` is set to a strong random value
- [ ] Review and test HTTPS redirect is working

#### Payment Gateway
- [x] Verify Paynow integration is set to "Live" mode in Paynow dashboard
- [ ] Test payment flow with real credentials in production
- [ ] Confirm callback URLs are accessible from Paynow servers
- [ ] Set up payment credential rotation schedule (recommended: every 90 days)

#### Database
- [x] Database indexes are created for performance:
  - `idx_orders_user_status` on orders(user_id, status)
  - `idx_orders_created_at` on orders(created_at)
  - `idx_order_items_order_id` on order_items(order_id)
  - `idx_product_images_product_id` on product_images(product_id)
- [ ] Database backups are configured
- [x] Review database connection pool settings (max 20, idle timeout 30s, connection timeout 10s)

#### Monitoring & Logging
- [x] Payment events are logged (structured JSON format)
- [x] Monitor for failed payment callbacks (PAYNOW_CALLBACK_REJECTED events)
- [ ] Set up alerts for payment failures

#### Exchange Rates
- [x] GBP/USD exchange rate is configured in database for Zimbabwe pricing (1.27)
- [x] GBP/ZAR exchange rate is configured for South Africa pricing (23.50)
- [ ] Schedule for updating exchange rates (recommended: daily)

#### Scalability Considerations
- [x] Graceful shutdown handlers for SIGTERM/SIGINT (database pool and HTTP server)
- [x] Stock validation with row-level locking to prevent overselling
- [x] Atomic stock decrement during order creation
- [x] Transaction wrapping for payment status updates
- **Cache Limitations (Single Instance)**:
  - Current in-memory product cache is per-instance (Map-based, 5-minute TTL)
  - For single-instance deployments (Replit default): Cache works correctly
  - For multi-instance deployments: Cache will return stale data across replicas
  - **Scaling Solution**: Migrate to Redis for shared cache when scaling beyond 1 instance
  - Alternative: Disable cache entirely via code when horizontal scaling is needed
- **Session Storage**: PostgreSQL-backed sessions (connect-pg-simple) - scales across instances
- **Database Seeding**: Guarded by `NODE_ENV !== "production"` to prevent accidental production seeding

### Post-Launch Monitoring

- Monitor payment callback logs for rejected or suspicious callbacks
- Track order conversion rates
- Review error logs for any issues
- Monitor database performance with query analysis