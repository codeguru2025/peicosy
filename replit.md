# Peicosy - Luxury E-Commerce Platform

## Overview

Peicosy is a high-end luxury e-commerce platform designed as a "private client" service connecting London's finest luxury goods to elite customers in South Africa. The application features a vibrant light theme with pink primary accents, navy text, and clean white aesthetic. Tagline: "Not for Everyone, Just for You."

The platform includes product browsing, dynamic landed cost calculation, proof of payment uploads, order management, and an admin dashboard for managing products, orders, and viewing analytics.

## Recent Changes (January 2026)

- **Dynamic Landed Cost Calculator**: Both frontend and backend now use database-driven shipping rates and customs rules. Order totals are calculated using actual rates, not hardcoded values.
- **Proof of Payment Upload**: Orders page allows users to upload payment proof via object storage with presigned URLs.
- **Admin Product Management**: Admin dashboard includes tabs for creating and deleting products.
- **Admin Order Management**: Admin dashboard allows viewing all orders and updating order status.
- **Product Details Page**: Individual product pages at /product/:id with landed cost estimates and add-to-cart functionality.

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
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Session Management**: Express sessions with Passport.js

### File Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (Navigation, Footer, CartDrawer)
│   ├── hooks/           # Custom hooks (use-auth, use-cart, use-products, use-orders)
│   ├── pages/           # Route pages (Home, Shop, Checkout, Orders, AdminDashboard)
│   └── lib/             # Utilities (queryClient, auth-utils)
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
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