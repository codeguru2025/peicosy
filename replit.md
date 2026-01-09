# Peicosy - Luxury E-Commerce Platform

## Overview

Peicosy is a high-end luxury e-commerce platform designed as a "private client" service connecting London's finest luxury goods to elite customers in South Africa. The application features a vibrant light theme with pink primary accents, navy text, and clean white aesthetic. Tagline: "Not for Everyone, Just for You."

The platform includes product browsing, dynamic landed cost calculation, proof of payment uploads, order management, and an admin dashboard for managing products, orders, and viewing analytics.

## Recent Changes (January 2026)

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
- **Default Admin**: username "peicosy", password "admin123" (change for production)

### PWA Features
- **Manifest**: client/public/manifest.json with app metadata and icons
- **Service Worker**: client/public/sw.js for offline caching
- **Splash Screen**: client/src/components/SplashScreen.tsx with animated logo
- **Theme Color**: #ec4899 (signature pink)

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