<div align="center">

# 🛍️ Multi-Vendor Marketplace

### A full-stack multi-vendor e-commerce platform built with Django REST Framework & React

[![Django](https://img.shields.io/badge/Django-5.1.4-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2.2-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Screenshots](#-screenshots) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Deployment](#-deployment) · [Contributing](#-contributing)

</div>

---

## 📖 Overview

A production-ready multi-vendor marketplace where **buyers** can browse and purchase products from multiple sellers, **vendors** can manage their own stores with real-time analytics, and **admins** have full platform oversight with commission tracking and content moderation.

Built with a dark glassmorphism UI inspired by Vision UI Dashboard, featuring hover animations, active state scaling, and a fully responsive layout across all devices.

---

## ✨ Features

### 🛒 Buyer Features
- Browse products with advanced filtering, search, and sorting
- Product detail pages with image gallery, variants, and reviews
- Persistent shopping cart with multi-vendor support
- Secure checkout with Stripe payment processing
- Coupon/discount code system
- Order tracking with real-time status updates
- Wishlist management
- Leave verified purchase reviews with photo uploads
- Vote reviews helpful / flag inappropriate content

### 🏪 Vendor Features
- Apply for a vendor account — reviewed by admin
- Full product management (create, edit, image upload, variants)
- Product approval workflow (draft → pending → live)
- Order management with shipping & tracking number entry
- Revenue analytics dashboard with Chart.js charts
  - Revenue vs Orders line chart (30-day overview)
  - Order status doughnut chart
  - Top products horizontal bar chart
- Commission tracking and payout request system
- Respond to customer reviews
- Store profile customization (logo, banner, description)

### 🔐 Admin Features
- Full platform dashboard with KPI cards and commission charts
- Vendor approval / suspension / rejection with email notification
- Product moderation queue — approve, reject, or feature
- Manual order status override with audit trail
- Review moderation — approve, reject, unflag, bulk actions
- Commission overview — per-vendor breakdown
- Payout processing workflow
- Platform settings (commission rates, auto-approval toggles)

### 🏗️ Technical Features
- JWT authentication with automatic token refresh
- Role-based access control (Buyer / Vendor / Admin)
- Multi-vendor order distribution — one checkout splits into per-vendor sub-orders
- Commission auto-calculation on every order item
- Denormalized stats (ratings, sales counts) for fast reads
- Paginated APIs with filtering, searching, and ordering
- Cloudinary image storage
- Redis caching
- Celery task queue (analytics snapshots)
- WhiteNoise static file serving
- CORS configured for cross-origin frontend

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.12 | Runtime |
| Django | 5.1.4 | Web framework |
| Django REST Framework | 3.15.2 | REST API |
| SimpleJWT | 5.3.1 | JWT authentication |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Caching & Celery broker |
| Celery | 5.4.0 | Async task queue |
| Stripe | 11.4.1 | Payment processing |
| Cloudinary | 1.41.0 | Image & media storage |
| WhiteNoise | 6.8.2 | Static file serving |
| Gunicorn | 23.0.0 | WSGI server (production) |
| django-filter | 24.3 | API filtering |
| django-cors-headers | 4.6.0 | CORS handling |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 5.1.4 | Build tool |
| MUI (Material UI) | 5.15 | Component library |
| Redux Toolkit | 2.2 | State management |
| RTK Query | (included) | API data fetching & caching |
| React Router | 6.22 | Client-side routing |
| Chart.js + react-chartjs-2 | 4.4 | Analytics charts |
| React Hook Form | 7.51 | Form management |
| Yup | 1.3 | Schema validation |
| Notistack | 3.0 | Toast notifications |
| Axios | 1.6 | HTTP client |
| dayjs | 1.11 | Date formatting |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Render | Django backend hosting |
| Vercel | React frontend hosting |
| Render PostgreSQL | Managed database |
| Cloudinary | Media storage |
| Stripe | Payment gateway |

---

## 📁 Project Structure

marketplace/
├── .gitignore

├── README.md

│

├── backend/                          # Django REST API

│   ├── manage.py

│   ├── requirements.txt

│   ├── .env.example                  # Environment template

│   ├── render.yaml                   # Render deployment config

│   │
│   ├── core/                         # Django project config

│   │   ├── settings.py               # All settings (env-driven)

│   │   ├── urls.py                   # Root URL routing
│   │   ├── wsgi.py

│   │   └── asgi.py
│   │
│   ├── accounts/                     # User auth & profiles

│   │   ├── models.py                 # User, Address, Tokens

│   │   ├── serializers.py            # Auth serializers

│   │   ├── views.py                  # Auth endpoints

│   │   ├── urls.py                   # Auth URL routing

│   │   ├── permissions.py            # RBAC permission classes

│   │   ├── emails.py                 # Transactional emails

│   │   └── admin.py                  # Custom user admin
│   │

│   ├── vendors/                      # Vendor management

│   │   ├── models.py                 # VendorProfile, Commission, Payouts

│   │   ├── serializers.py

│   │   ├── views.py

│   │   ├── urls.py

│   │   └── admin.py

│   │
│   ├── products/                     # Product catalog

│   │   ├── models.py                 # Category, Product, Images, Variants

│   │   ├── serializers.py

│   │   ├── views.py

│   │   ├── urls.py

│   │   ├── filters.py                # Django-filter filterset

│   │   └── admin.py

│   │
│   ├── orders/                       # Cart, checkout & orders

│   │   ├── models.py                 # Cart, Order, VendorOrder, OrderItem

│   │   ├── serializers.py

│   │   ├── views.py

│   │   ├── urls.py

│   │   ├── services.py               # Order distribution logic

│   │   ├── filters.py

│   │   └── admin.py

│   │
│   ├── reviews/                      # Reviews & moderation

│   │   ├── models.py                 # ProductReview, VendorReview, Flags

│   │   ├── serializers.py

│   │   ├── views.py

│   │   ├── urls.py

│   │   ├── filters.py

│   │   └── admin.py

│   │
│   └── analytics/                    # Sales analytics

│       ├── models.py                 # DailySalesSnapshot, ProductViewLog

│       ├── urls.py

│       └── admin.py

│
└── frontend/                         # React + Vite SPA

├── index.html

├── package.json

├── vite.config.js

├── .env.example

│
└── src/

├── main.jsx                  # App entry point

├── index.css                 # Global styles & CSS variables

│
├── theme/                    # MUI theme customization

│   ├── index.js              # Theme creation

│   ├── palette.js            # Color palette

│   ├── typography.js         # Font settings

│   └── components.js         # Component overrides

│
├── store/                    # Redux store

│   ├── index.js              # Store configuration

│   ├── slices/

│   │   ├── authSlice.js      # Auth state + localStorage sync

│   │   ├── cartSlice.js      # Cart drawer state

│   │   └── uiSlice.js        # Sidebar, page title

│   └── api/

│       ├── baseApi.js        # RTK Query base with auto token refresh

│       ├── authApi.js        # Auth endpoints

│       ├── productApi.js     # Product endpoints

│       ├── orderApi.js       # Order & cart endpoints

│       ├── reviewApi.js      # Review endpoints

│       └── vendorApi.js      # Vendor endpoints

│
├── routes/

│   ├── index.jsx             # All routes with lazy loading

│   ├── ProtectedRoute.jsx    # Redirect unauthenticated users

│   └── RoleRoute.jsx         # Redirect unauthorized roles

│
├── layouts/

│   ├── MainLayout.jsx        # Public pages (Navbar + content)

│   ├── DashboardLayout.jsx   # Dashboard (Sidebar + Navbar + content)

│   └── AuthLayout.jsx        # Auth pages (centered card)

│
├── components/

│   ├── ui/                   # Reusable UI primitives

│   │   ├── GlassCard.jsx     # Glassmorphism card

│   │   ├── GradientButton.jsx

│   │   ├── StarRating.jsx

│   │   ├── LoadingSpinner.jsx

│   │   ├── EmptyState.jsx

│   │   └── Pagination.jsx

│   ├── navbar/

│   │   ├── Navbar.jsx        # Top navigation bar

│   │   └── CartDrawer.jsx    # Slide-out cart

│   ├── sidebar/

│   │   ├── Sidebar.jsx       # Collapsible dashboard sidebar

│   │   └── SidebarItem.jsx   # Individual nav item

│   ├── product/

│   │   ├── ProductCard.jsx   # Product listing card

│   │   ├── ProductFilters.jsx

│   │   └── ProductImageGallery.jsx

│   ├── charts/

│   │   ├── RevenueChart.jsx  # Line chart

│   │   ├── OrderStatusChart.jsx # Doughnut chart

│   │   └── TopProductsChart.jsx # Horizontal bar chart

│   ├── vendor/

│   │   ├── OrderStatusBadge.jsx

│   │   └── ProductFormModal.jsx

│   └── admin/

│       ├── StatCard.jsx

│       ├── AdminDataTable.jsx

│       └── ConfirmDialog.jsx

│
└── pages/

├── auth/

│   ├── LoginPage.jsx

│   └── RegisterPage.jsx  # Buyer / Vendor toggle

├── buyer/

│   ├── HomePage.jsx      # Hero + featured products

│   ├── ProductsPage.jsx  # Browse with filters

│   ├── ProductDetailPage.jsx

│   ├── VendorsPage.jsx

│   ├── VendorStorePage.jsx

│   ├── CartPage.jsx

│   ├── CheckoutPage.jsx

│   ├── OrderSuccessPage.jsx

│   └── OrderHistoryPage.jsx


├── vendor/

│   ├── VendorDashboardPage.jsx

│   ├── VendorProductsPage.jsx

│   ├── VendorOrdersPage.jsx

│   ├── VendorAnalyticsPage.jsx

│   ├── VendorReviewsPage.jsx

│   ├── VendorPayoutsPage.jsx

│   └── VendorSettingsPage.jsx

└── admin/

├── AdminDashboardPage.jsx

├── AdminVendorsPage.jsx

├── AdminProductsPage.jsx

├── AdminOrdersPage.jsx

├── AdminReviewsPage.jsx

├── AdminUsersPage.jsx

└── AdminSettingsPage.jsx


---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Python 3.12](https://python.org/downloads/) — **use 3.12, not 3.14**
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 16](https://postgresql.org/download/) — or use SQLite for local dev
- [Git](https://git-scm.com/)

Optional but recommended:
- [Redis](https://redis.io/) — for caching (falls back to in-memory if not running)

---

### 🔧 Backend Setup

#### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/marketplace.git
cd marketplace
```

#### 2. Create and activate virtual environment

```bash
# Create venv in the project root
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — Mac / Linux
source venv/bin/activate
```

#### 3. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 4. Configure environment variables

```bash
# Copy the template
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```bash
# Required
SECRET_KEY=your-random-50-char-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database — use SQLite for quick local setup
# Leave DATABASE_URL empty to use SQLite automatically
DATABASE_URL=

# Or use PostgreSQL
# DATABASE_URL=postgresql://postgres:password@localhost:5432/marketplace_db

# Cloudinary — get free account at cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe — get test keys at stripe.com/docs/keys
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email — use Gmail with App Password
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> **Tip:** Generate a SECRET_KEY with:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

#### 5. Create the database and run migrations

```bash
# Run from backend/ folder
python manage.py makemigrations accounts
python manage.py makemigrations vendors
python manage.py makemigrations products
python manage.py makemigrations orders
python manage.py makemigrations reviews
python manage.py makemigrations analytics
python manage.py migrate
```

#### 6. Create a superuser (admin account)

```bash
python manage.py createsuperuser
```

Follow the prompts — use `admin` role when asked.

#### 7. Start the backend server

```bash
python manage.py runserver
```

Backend is now running at **http://127.0.0.1:8000**

- Django Admin: http://127.0.0.1:8000/admin/
- API Root: http://127.0.0.1:8000/api/v1/

---

### ⚛️ Frontend Setup

#### 1. Install dependencies

```bash
# From the marketplace/ root
cd frontend
npm install
```

#### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

#### 3. Start the development server

```bash
npm run dev
```

Frontend is now running at **http://localhost:5173**

---

### ✅ Verify everything works

Open your browser and check:

| URL | Expected |
|-----|---------|
| http://localhost:5173 | Homepage loads with dark UI |
| http://localhost:5173/register | Registration form |
| http://localhost:5173/login | Login form |
| http://127.0.0.1:8000/admin/ | Django admin panel |
| http://127.0.0.1:8000/api/v1/products/ | Returns `{"count": 0, "results": []}` |
| http://127.0.0.1:8000/api/v1/products/categories/ | Returns categories list |

---

## 🧭 User Guide

### Registering & Roles

| Role | How to get it | What they can do |
|------|-------------|-----------------|
| **Buyer** | Register at `/register` → select Buyer | Browse, cart, checkout, review |
| **Vendor** | Register at `/register` → select Seller | Manage store, list products, fulfil orders |
| **Admin** | Created via `createsuperuser` or Django admin | Full platform control |

### Typical Workflow
Admin creates categories via Django Admin
→ /admin/ → Products → Categories → Add
Vendor registers & applies for store
→ /register → I'm a Seller → fill store details
Admin approves vendor
→ /admin/vendors → Approve
OR → Frontend Admin Panel → /admin/vendors → Approve
Vendor lists products
→ /vendor/products → Add Product
Admin approves products
→ /admin/products → Approve
Buyer browses and purchases
→ /products → Add to Cart → Checkout
Vendor fulfils order
→ /vendor/orders → Update to Shipped → Enter tracking
Buyer leaves review
→ /my-orders → Leave Review

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1/`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/auth/register/buyer/` | Register as buyer | None |
| POST | `/auth/register/vendor/` | Register as vendor | None |
| POST | `/auth/login/` | Login, get JWT tokens | None |
| POST | `/auth/logout/` | Blacklist refresh token | JWT |
| POST | `/auth/token/refresh/` | Refresh access token | None |
| GET/PUT | `/auth/me/` | View/update own profile | JWT |
| POST | `/auth/change-password/` | Change password | JWT |
| POST | `/auth/forgot-password/` | Request reset email | None |
| POST | `/auth/reset-password/` | Reset with token | None |
| POST | `/auth/verify-email/` | Verify email address | None |
| GET/POST | `/auth/addresses/` | Manage addresses | JWT |

### Products

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/products/` | List all active products | None |
| GET | `/products/featured/` | Featured products | None |
| GET | `/products/<slug>/` | Product detail | None |
| GET | `/products/<slug>/related/` | Related products | None |
| GET | `/products/categories/` | All categories | None |
| GET | `/products/categories/<slug>/` | Category detail | None |
| POST | `/products/categories/create/` | Create category | Admin |
| GET/POST | `/products/vendor/my-products/` | Vendor's products | Vendor |
| GET/PUT/DELETE | `/products/vendor/my-products/<id>/` | Manage product | Vendor |
| POST | `/products/vendor/my-products/<id>/images/` | Upload images | Vendor |
| GET | `/products/admin/all/` | All products | Admin |
| PATCH | `/products/admin/<id>/status/` | Approve/reject | Admin |
| PATCH | `/products/admin/<id>/feature/` | Toggle featured | Admin |
| GET/POST | `/products/wishlist/` | Wishlist | JWT |
| DELETE | `/products/wishlist/<id>/` | Remove from wishlist | JWT |

### Orders

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET/POST/DELETE | `/orders/cart/` | Cart management | JWT |
| PATCH/DELETE | `/orders/cart/items/<id>/` | Update/remove item | JWT |
| POST | `/orders/coupons/validate/` | Validate coupon | JWT |
| POST | `/orders/checkout/` | Create order | JWT |
| POST | `/orders/confirm-payment/` | Confirm Stripe payment | JWT |
| GET | `/orders/my-orders/` | Buyer's order history | JWT |
| GET | `/orders/my-orders/<number>/` | Order detail | JWT |
| POST | `/orders/my-orders/<number>/cancel/` | Cancel order | JWT |
| GET | `/orders/vendor/orders/` | Vendor's sub-orders | Vendor |
| PATCH | `/orders/vendor/orders/<id>/update/` | Update status + tracking | Vendor |
| GET | `/orders/vendor/commissions/` | Commission records | Vendor |
| GET | `/orders/admin/all/` | All orders | Admin |
| PATCH | `/orders/admin/all/<number>/status/` | Override status | Admin |
| GET | `/orders/admin/commissions/` | Commission overview | Admin |

### Reviews

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/reviews/products/<slug>/` | Product reviews | None |
| GET | `/reviews/products/<slug>/summary/` | Rating summary | None |
| POST | `/reviews/products/create/` | Submit review | JWT |
| GET/PUT/DELETE | `/reviews/<id>/` | Manage own review | JWT |
| POST/DELETE | `/reviews/<id>/helpful/` | Vote helpful | JWT |
| POST | `/reviews/<id>/flag/` | Flag review | JWT |
| GET | `/reviews/my-reviews/` | My reviews | JWT |
| GET | `/reviews/pending-items/` | Items awaiting review | JWT |
| GET | `/reviews/vendor/my-reviews/` | Vendor's reviews | Vendor |
| POST/DELETE | `/reviews/vendor/<id>/respond/` | Respond to review | Vendor |
| GET | `/reviews/admin/all/` | All reviews | Admin |
| POST | `/reviews/admin/<id>/moderate/` | Approve/reject/flag | Admin |
| POST | `/reviews/admin/bulk-moderate/` | Bulk moderation | Admin |
| GET | `/reviews/admin/flagged/` | Flagged reviews queue | Admin |

### Vendors

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/vendors/` | All active stores | None |
| GET | `/vendors/<slug>/` | Store detail | None |
| GET | `/vendors/<slug>/products/` | Store products | None |
| GET | `/vendors/dashboard/` | Vendor dashboard data | Vendor |
| GET/PATCH | `/vendors/dashboard/profile/` | Update store profile | Vendor |
| GET/POST | `/vendors/dashboard/payouts/` | Payout requests | Vendor |
| GET | `/vendors/admin/all/` | All vendors | Admin |
| PATCH | `/vendors/admin/all/<id>/status/` | Approve/suspend | Admin |
| GET | `/vendors/admin/payouts/` | All payout requests | Admin |
| PATCH | `/vendors/admin/payouts/<id>/process/` | Process payout | Admin |

---

## 🎨 UI Design System

The frontend uses a custom dark glassmorphism theme built on MUI v5.

### Color Palette

Primary Blue:    #4318FF
Secondary Blue:  #0075FF
Purple:          #7B2FF7
Pink:            #F72585
Success:         #10B981
Warning:         #FF9800
Error:           #F44336
Star/Gold:       #F59E0B
Background:      linear-gradient(135deg, #0f0c29, #302b63, #24243e)
Card:            rgba(255, 255, 255, 0.05) + blur(20px)
Border:          rgba(255, 255, 255, 0.12)

### Interaction Patterns

- **Hover:** Cards lift `translateY(-4px)` with blue glow shadow
- **Active/Click:** Element scales `scale(1.02)`, z-index elevated
- **Focus:** Blue glow ring `0 0 0 3px rgba(67,24,255,0.20)`
- **Sidebar items:** Slide right `translateX(2px)` + left accent bar
- **Buttons:** Lift `translateY(-1px)` on hover, shrink `scale(0.98)` on click

### CSS Variables (available globally)

```css
--gradient-primary:  linear-gradient(135deg, #4318FF 0%, #0075FF 100%)
--gradient-purple:   linear-gradient(135deg, #7B2FF7 0%, #F72585 100%)
--gradient-dark:     linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)
--shadow-glow:       0 0 40px rgba(67, 24, 255, 0.25)
--shadow-hover:      0 16px 48px rgba(67, 24, 255, 0.35)
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1)
--radius-lg:         16px
--radius-xl:         24px
```

---

## ☁️ Deployment

### Backend → Render

#### 1. Create `backend/render.yaml`

```yaml
services:
  - type: web
    name: marketplace-api
    env: python
    buildCommand: "pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate"
    startCommand: "gunicorn core.wsgi:application"
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: "False"
      - key: ALLOWED_HOSTS
        value: ".onrender.com"
      - key: DATABASE_URL
        fromDatabase:
          name: marketplace-db
          property: connectionString
      - key: CORS_ALLOWED_ORIGINS
        value: "https://your-app.vercel.app"

databases:
  - name: marketplace-db
    databaseName: marketplace
    user: marketplace_user
```

#### 2. Deploy steps

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Set Root Directory to `backend`
5. Add all environment variables from your `.env` file
6. Click **Deploy**

#### 3. After deploy — update CORS

In Render environment variables, set:
CORS_ALLOWED_ORIGINS=https://your-app-name.vercel.app
ALLOWED_HOSTS=your-api-name.onrender.com

---

### Frontend → Vercel

#### 1. Create `frontend/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url",
    "VITE_STRIPE_PUBLIC_KEY": "@vite_stripe_public_key"
  }
}
```

#### 2. Deploy steps

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set Root Directory to `frontend`
4. Add environment variables:
   - `VITE_API_BASE_URL` = `https://your-api-name.onrender.com/api/v1`
   - `VITE_STRIPE_PUBLIC_KEY` = your Stripe public key
5. Click **Deploy**

---

### Environment Variables — Production Checklist

#### Backend (Render)

```bash
SECRET_KEY=<generate-a-strong-random-key>
DEBUG=False
ALLOWED_HOSTS=your-api-name.onrender.com
DATABASE_URL=<auto-provided-by-render>
REDIS_URL=<your-redis-url>
CLOUDINARY_CLOUD_NAME=<your-value>
CLOUDINARY_API_KEY=<your-value>
CLOUDINARY_API_SECRET=<your-value>
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_HOST_USER=<your-email>
EMAIL_HOST_PASSWORD=<your-app-password>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
DEFAULT_COMMISSION_RATE=10.0
```

#### Frontend (Vercel)

```bash
VITE_API_BASE_URL=https://your-api-name.onrender.com/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

## 🔒 Security

### Files Never Committed to Git

| File | Contains |
|------|---------|
| `backend/.env` | Django SECRET_KEY, DB password, Stripe secret keys, email password |
| `frontend/.env` | Stripe public key |
| `venv/` | Python packages (regenerated via `pip install`) |
| `node_modules/` | Node packages (regenerated via `npm install`) |
| `*.sqlite3` | Local development database |
| `backend/media/` | User-uploaded files |
| `backend/staticfiles/` | Generated static files |
| `frontend/dist/` | Production build output |

### What IS safe to commit

| File | Why it's safe |
|------|-------------|
| `backend/.env.example` | Template only — no real values |
| `frontend/.env.example` | Template only — no real values |
| `requirements.txt` | Package list — no secrets |
| `package.json` | Package list — no secrets |
| All source code | Your application logic |

### Permission Classes (RBAC)

```python
# Import from accounts/permissions.py
from accounts.permissions import (
    IsBuyer,          # role == "buyer"
    IsVendor,         # role == "vendor"
    IsVendorActive,   # role == "vendor" AND store status == "active"
    IsAdminUser,      # role == "admin"
    IsOwnerOrAdmin,   # object.user == request.user OR admin
    IsVendorOwnerOrAdmin,  # object.vendor.user == request.user OR admin
    IsVerified,       # is_verified == True
)
```

---

## 🧪 Testing the API

You can test the API using the curl examples below or import into Postman.

### Register & Login

```bash
# Register a buyer
curl -X POST http://127.0.0.1:8000/api/v1/auth/register/buyer/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "TestPass123!",
    "password2": "TestPass123!",
    "role": "buyer"
  }'

# Login
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "buyer@test.com", "password": "TestPass123!"}'

# Get profile (replace TOKEN with access token from login)
curl http://127.0.0.1:8000/api/v1/auth/me/ \
  -H "Authorization: Bearer TOKEN"
```

### Products

```bash
# List products
curl http://127.0.0.1:8000/api/v1/products/

# Search and filter
curl "http://127.0.0.1:8000/api/v1/products/?search=shoes&min_price=20&max_price=100&ordering=-average_rating"

# Get categories
curl http://127.0.0.1:8000/api/v1/products/categories/
```

### Cart & Checkout

```bash
# Add to cart
curl -X POST http://127.0.0.1:8000/api/v1/orders/cart/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "PRODUCT_UUID", "quantity": 2}'

# Checkout
curl -X POST http://127.0.0.1:8000/api/v1/orders/checkout/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_full_name": "John Doe",
    "shipping_street": "123 Main St",
    "shipping_city": "New York",
    "shipping_state": "NY",
    "shipping_postal_code": "10001",
    "shipping_country": "US",
    "billing_same_as_shipping": true
  }'
```

---

## 🗺️ Roadmap

- [ ] Real-time notifications (Django Channels / WebSockets)
- [ ] Advanced search with Elasticsearch
- [ ] Vendor analytics with date range picker
- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Subscription/recurring products
- [ ] Affiliate system
- [ ] AI product recommendations
- [ ] Bulk product import via CSV
- [ ] Advanced coupon rules (BOGO, category-specific)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
```bash
   git checkout -b feature/your-feature-name
```
3. Make your changes and commit
```bash
   git commit -m "Add: your feature description"
```
4. Push to your fork
```bash
   git push origin feature/your-feature-name
```
5. Open a Pull Request

### Commit Message Convention

Add:    new feature
Fix:    bug fix
Update: change to existing feature
Remove: deleted something
Docs:   documentation only
Style:  formatting, no logic change
Refactor: code restructure, no feature change

---

## 📄 License

This project is licensed under the MIT License.

MIT License
Copyright (c) 2026 Your Name
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 👤 Author

**Your Name**
- GitHub: https://github.com/andriafraderick
- LinkedIn: https://www.linkedin.com/in/andriafraderick/

---

<div align="center">

Built with ❤️ using Django + React

⭐ Star this repo if you found it helpful!

</div>
