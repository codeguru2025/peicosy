# Peicosy Setup Guide

This guide covers how to download, set up, and run the Peicosy luxury e-commerce platform.

## Downloading the Source Code

### Option 1: Download ZIP from Replit
1. Open your Replit project
2. Click on the three dots (...) menu in the Files panel
3. Select "Download as ZIP"
4. Extract the ZIP file to your desired location

### Option 2: Clone via Git
If your Replit project is connected to GitHub:
```bash
git clone https://github.com/your-username/peicosy.git
cd peicosy
```

## Local Development Setup

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn**

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up PostgreSQL Database

Create a new database:
```sql
CREATE DATABASE peicosy;
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/peicosy

# Session Security (generate a random 32+ character string)
SESSION_SECRET=your-very-long-random-secret-string-here

# Admin Credentials (change these for production!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Paynow Integration (Zimbabwe Payments)
PAYNOW_INTEGRATION_ID=your-paynow-id
PAYNOW_INTEGRATION_KEY=your-paynow-key
```

### Step 4: Initialize Database

Push the schema to your database:
```bash
npm run db:push
```

### Step 5: Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5000`

## Production Deployment

### Building for Production

```bash
npm run build
```

This creates:
- `dist/public/` - Frontend static files
- `dist/server.js` - Backend server bundle

### Running in Production

```bash
NODE_ENV=production npm start
```

### Environment Variables for Production

All environment variables from development, plus:

```env
# Force production mode
NODE_ENV=production

# Your production database URL
DATABASE_URL=postgresql://user:pass@production-host:5432/peicosy_prod
```

## Configuration Options

### Exchange Rates

Exchange rates are stored in the database. Update them via the admin dashboard or directly:

```sql
-- Set GBP to ZAR rate (South Africa)
INSERT INTO exchange_rates (from_currency, to_currency, rate) 
VALUES ('GBP', 'ZAR', 23.50)
ON CONFLICT (from_currency, to_currency) 
DO UPDATE SET rate = 23.50, updated_at = NOW();

-- Set GBP to USD rate (Zimbabwe)
INSERT INTO exchange_rates (from_currency, to_currency, rate) 
VALUES ('GBP', 'USD', 1.27)
ON CONFLICT (from_currency, to_currency) 
DO UPDATE SET rate = 1.27, updated_at = NOW();
```

### Shipping Rates

Configure shipping rates in the database:

```sql
INSERT INTO shipping_rates (country_code, method, rate_per_kg, base_rate, estimated_days)
VALUES 
  ('ZA', 'air', 15.00, 50.00, '5-7'),
  ('ZA', 'sea', 5.00, 30.00, '21-28'),
  ('ZW', 'air', 18.00, 60.00, '7-10'),
  ('ZW', 'sea', 6.00, 35.00, '28-35');
```

### Customs Rules

Configure customs duty rates:

```sql
INSERT INTO customs_rules (country_code, category, duty_percentage, vat_percentage)
VALUES 
  ('ZA', 'Handbags', 25.0, 15.0),
  ('ZA', 'Watches', 20.0, 15.0),
  ('ZW', 'Handbags', 30.0, 14.5);
```

## Troubleshooting

### Database Connection Errors
- Verify PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Ensure the database exists

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Module Not Found Errors
```bash
rm -rf node_modules
npm install
```

### Database Schema Issues
```bash
npm run db:push --force
```

## File Upload Configuration

Product images are stored using Replit Object Storage. For self-hosted deployments:

1. Configure cloud storage (AWS S3, Google Cloud Storage, etc.)
2. Update `server/storage.ts` upload handlers
3. Set appropriate environment variables for your storage provider

## Security Checklist

Before going live:

- [ ] Change default admin credentials
- [ ] Set strong SESSION_SECRET (32+ random characters)
- [ ] Enable HTTPS (handled automatically on Replit)
- [ ] Review and test Paynow integration in live mode
- [ ] Set up database backups
- [ ] Monitor application logs for errors

## Getting Help

- Review the [README.md](./README.md) for API documentation
- Check [replit.md](./replit.md) for technical architecture details
- Contact support at info@peicosy.com
