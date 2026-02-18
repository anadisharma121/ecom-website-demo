# E-Commerce Application

A full-stack e-commerce application built with **Next.js 14**, **React**, **PostgreSQL**, and **Prisma ORM**. Ready for AWS deployment.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (JWT-based sessions)
- **Styling:** Tailwind CSS

## Features

### Admin Panel
- **Dashboard** with real-time stats (products, users, orders, revenue)
- **Product Management** – Add, edit, delete products category-wise
- **Category Management** – Create/manage product categories with emojis
- **User Management** – Create users, assign category access, delete users
- **Order Management** – View all orders, update statuses, clear orders

### User Panel
- **Login** (accounts created by admin only)
- **Shop** – Browse products filtered by assigned categories
- **Cart** – Add/remove items, adjust quantities
- **Place Orders** – Checkout from cart
- **Track Orders** – Visual order status tracking (Pending → Delivered)
- **Change Password**

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)

### 1. Install Dependencies
```bash
cd ecom-app
npm install
```

### 2. Configure Environment

Edit `.env` with your PostgreSQL connection string:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ecom_db?schema=public"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (or use migrations)
npx prisma db push

# Seed default data (admin user + sample categories/products)
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Login
- **Admin:** username: `admin`, password: `admin123`

## Project Structure

```
ecom-app/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home (redirects)
│   │   ├── login/             # Login page
│   │   ├── admin/             # Admin panel
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── products/      # Product management
│   │   │   ├── categories/    # Category management
│   │   │   ├── users/         # User management
│   │   │   └── orders/        # Order management
│   │   ├── store/             # User store
│   │   │   ├── page.tsx       # Shop page
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── orders/        # Order history
│   │   │   └── change-password/
│   │   └── api/               # API routes
│   │       ├── auth/          # NextAuth
│   │       ├── products/      # Product CRUD
│   │       ├── categories/    # Category CRUD
│   │       ├── users/         # User CRUD
│   │       ├── orders/        # Order CRUD
│   │       ├── dashboard/     # Dashboard stats
│   │       └── change-password/
│   ├── components/            # React components
│   ├── context/               # Cart context
│   ├── lib/                   # Prisma & auth config
│   └── types/                 # TypeScript types
├── .env                       # Environment variables
├── package.json
└── tailwind.config.ts
```

## Database Schema

- **User** – username, password(hashed), role (ADMIN/USER)
- **Category** – name, emoji, description
- **UserCategory** – many-to-many linking users to allowed categories
- **Product** – name, description, price, image, categoryId
- **Order** – userId, total, status
- **OrderItem** – orderId, productId, quantity, price

## AWS Deployment (Future)

The app is structured for easy AWS deployment:
- **Frontend + API:** AWS Amplify or EC2 with Next.js standalone build
- **Database:** Amazon RDS (PostgreSQL)
- **Static Assets:** Amazon S3 + CloudFront
- **Environment:** AWS Systems Manager Parameter Store for secrets

### Build for Production
```bash
npm run build
npm start
```
