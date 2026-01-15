# Peicosy - Luxury E-Commerce Platform

## Overview

Peicosy is a high-end luxury e-commerce platform offering a "private client" service that connects London's luxury goods to elite customers in South Africa. The platform features product browsing, dynamic landed cost calculation, proof of payment uploads, comprehensive order management, and an admin dashboard for product and order oversight, including analytics. Its design embodies a luxury aesthetic with a vibrant light theme, pink accents, and navy text. The business vision is to provide an exclusive shopping experience under the tagline: "Not for Everyone, Just for You."

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query (server state), Zustand (client state with persistence for shopping cart)
- **Styling**: Tailwind CSS, custom luxury theme (deep charcoal/midnight navy, signature pink accents)
- **UI Components**: shadcn/ui, Radix UI primitives
- **Typography**: Playfair Display (headlines), DM Sans (body)
- **Features**: PWA support (manifest.json, service worker), animated splash screen, mobile-first responsive design, optimized image handling with lazy loading.

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints (`/api/*`)
- **Build Tool**: esbuild (server), Vite (client)
- **Modular Structure**: Domain-focused route modules (auth, products, orders, admin, shipping, payments).
- **Security**: Helmet.js for HTTP headers, bcrypt for password hashing (12 salt rounds), robust validation, CSRF protection, session rotation, IDOR protection, rate limiting, file upload validation, stock validation with row-level locking, atomic stock decrement.
- **Caching**: In-memory Map-based product cache with 5-minute TTL, automatic invalidation.
- **Logging**: Structured JSON-formatted logs with PII sanitization.

### Database
- **Type**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema**: `shared/schema.ts`
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple.

### Authentication
- **Method**: Username/password via bcrypt
- **Session Management**: Express sessions with Passport.js
- **Admin**: Configurable via `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables.

### Key Features
- **Paynow Zimbabwe Integration**: Web checkout (Visa, Mastercard) and mobile money (Ecocash, OneMoney) with GBP to USD conversion and secure callback handling.
- **Multi-Image Product System**: Supports multiple images per product with roles (thumbnail, hero, gallery), drag-and-drop uploader, and cloud storage integration.
- **Admin Reports & Analytics**: Key business metrics, revenue trends, order status distribution, product/category performance.
- **Data Export**: CSV/JSON export for all database tables.

## External Dependencies

### Database
- **PostgreSQL**
- **Drizzle ORM**

### Authentication
- **Replit Auth**: OIDC-based authentication
- **Passport.js**: Authentication middleware

### File Storage
- **Google Cloud Storage**: Via Replit's sidecar service
- **Uppy**: Client-side file upload library

### UI/Charting
- **Recharts**: For admin dashboard analytics
- **Framer Motion**: For animations
- **Lucide React**: Icon library

### Payment Gateways
- **Paynow**: For Zimbabwe payments

### Key NPM Packages
- `@tanstack/react-query`
- `zustand`
- `wouter`
- `zod`
- `drizzle-orm`, `drizzle-kit`
- `express-session`, `connect-pg-simple`
- `bcrypt`
- `helmet`
- `csurf`