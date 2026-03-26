# Peicosy - Luxury E-Commerce Platform

A premium luxury e-commerce platform designed as a "private client" service connecting London's finest luxury goods to elite customers in South Africa and Zimbabwe.

**Tagline:** *Not for Everyone, Just for You*

## Features

### Customer Features
- **Product Catalog**: Browse curated luxury products with detailed descriptions and multiple images
- **Multi-Currency Support**: Automatic GBP to ZAR (South Africa) and USD (Zimbabwe) conversion
- **Landed Cost Calculator**: Transparent pricing including shipping, customs, and duties
- **Shopping Cart**: Persistent cart with local storage
- **Order Management**: Track orders and upload payment proofs
- **PWA Support**: Install as mobile app with offline capabilities

### Payment Methods
- **South Africa**: Bank Transfer with proof of payment upload
- **Zimbabwe**: Paynow integration (Visa, Mastercard, Ecocash, OneMoney)

### Admin Features
- **Product Management**: Add, edit, delete products with multi-image support
- **Order Management**: View and update order statuses
- **Analytics Dashboard**: Revenue trends, order statistics, top products
- **Data Export**: Export orders, products, customers in CSV/JSON format
- **Reports**: Business metrics and category performance analysis

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom luxury theme
- **shadcn/ui** component library
- **Wouter** for routing
- **TanStack React Query** for data fetching
- **Zustand** for cart state management

### Backend
- **Node.js** with Express
- **TypeScript** with ESM modules
- **Drizzle ORM** for database operations
- **PostgreSQL** database

### Security
- **bcrypt** password hashing (12 salt rounds)
- **HTTP-only secure cookies** for sessions
- **PostgreSQL-backed sessions** via connect-pg-simple
- **Input validation** with Zod schemas

## Project Structure

```
peicosy/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route pages
│   │   ├── lib/            # Utilities and helpers
│   │   └── assets/         # Static assets
│   └── public/             # Public files (favicon, manifest)
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── paynow.ts           # Paynow payment integration
│   └── db.ts               # Database connection
├── shared/                 # Shared code between client/server
│   └── schema.ts           # Drizzle database schema
└── migrations/             # Database migrations
```

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd peicosy
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file with the following:
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
SESSION_SECRET=your-secure-random-string-32-chars-min

# Admin Credentials
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password

# Paynow (Zimbabwe payments)
PAYNOW_INTEGRATION_ID=your-paynow-id
PAYNOW_INTEGRATION_KEY=your-paynow-key

# DigitalOcean Spaces (file uploads / CDN)
DO_SPACES_KEY=your-spaces-access-key
DO_SPACES_SECRET=your-spaces-secret-key
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_REGION=nyc3
DO_SPACES_CDN_ENDPOINT=https://your-bucket.nyc3.cdn.digitaloceanspaces.com

# Application base URL (used for payment callbacks)
APP_BASE_URL=https://your-domain.com
```

4. **Set up the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## API Documentation

### Authentication

#### POST /api/auth/register
Register a new user account.
```json
{
  "username": "string",
  "password": "string",
  "email": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
```

#### POST /api/auth/login
Login with username and password.
```json
{
  "username": "string",
  "password": "string"
}
```

#### POST /api/auth/logout
Logout current user session.

#### GET /api/auth/user
Get current authenticated user.

### Products

#### GET /api/products
Get all products. Query parameters:
- `category` - Filter by category
- `search` - Search in name, brand, description

#### GET /api/products/:id
Get single product by ID.

#### POST /api/products (Admin)
Create new product.

#### PATCH /api/products/:id (Admin)
Update product.

#### DELETE /api/products/:id (Admin)
Delete product.

### Orders

#### GET /api/orders
Get current user's orders.

#### GET /api/orders/all (Admin)
Get all orders.

#### POST /api/orders
Create new order.
```json
{
  "items": [{"productId": 1, "quantity": 2}],
  "shippingMethod": "air" | "sea",
  "shippingAddress": {
    "street": "string",
    "city": "string",
    "zip": "string",
    "country": "South Africa" | "Zimbabwe"
  }
}
```

#### PATCH /api/orders/:id/status (Admin)
Update order status.

### Payments

#### POST /api/payment/paynow/initiate
Initiate Paynow web checkout (Visa/Mastercard).
```json
{
  "orderId": 123
}
```

#### POST /api/payment/paynow/mobile
Initiate Paynow mobile payment (Ecocash/OneMoney).
```json
{
  "orderId": 123,
  "phone": "0771234567",
  "method": "ecocash" | "onemoney"
}
```

#### GET /api/payment/paynow/status/:orderId
Check payment status.

### Shipping

#### POST /api/calculate-shipping
Calculate shipping and landed costs.
```json
{
  "items": [{"productId": 1, "quantity": 2}],
  "shippingMethod": "air" | "sea",
  "destinationCountry": "South Africa" | "Zimbabwe"
}
```

## Deployment

1. **Build the application**
```bash
npm run build
```

2. **Start production server**
```bash
npm start
```

### Production Checklist

#### Security
- [ ] Set strong `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Set random 32+ character `SESSION_SECRET`
- [ ] Configure Paynow credentials for live mode
- [ ] Enable HTTPS
- [ ] Configure DigitalOcean Spaces credentials
- [ ] Set `APP_BASE_URL` for payment callbacks

#### Database
- [ ] Configure database backups
- [ ] Verify indexes are created:
  - `idx_orders_user_status`
  - `idx_orders_created_at`
  - `idx_order_items_order_id`
  - `idx_product_images_product_id`

#### Exchange Rates
- [ ] Configure GBP/USD rate for Zimbabwe
- [ ] Configure GBP/ZAR rate for South Africa
- [ ] Set up daily rate updates

## Scalability

The application is designed for scalability:

- **Database**: PostgreSQL with Drizzle ORM, optimized indexes
- **Sessions**: PostgreSQL-backed sessions (horizontally scalable)
- **Stateless API**: Express REST API can run on multiple instances
- **Frontend**: Static assets can be CDN-hosted

### Recommended for High Traffic
- Add Redis caching for exchange rates and product listings
- Implement background job queue for payment polling
- Use CDN for static assets and product images

## Accessibility

- Skip navigation link for keyboard users
- Semantic HTML landmarks
- ARIA labels on interactive elements
- High contrast color scheme
- Responsive design for all devices

## License

Proprietary - All rights reserved.

## Support

For technical support, contact: info@peicosy.com
