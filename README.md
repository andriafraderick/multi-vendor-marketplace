# Multi-Vendor Marketplace

A full-stack multi-vendor marketplace built with Django REST Framework and React.

## Tech Stack

**Backend:** Django 5.1 · DRF · PostgreSQL · Redis · Celery · Stripe · Cloudinary  
**Frontend:** React 18 · Vite · MUI v5 · Redux Toolkit · RTK Query · Chart.js

## Features

- Role-based access: Buyer · Vendor · Admin
- Multi-vendor order distribution with commission tracking
- Vendor dashboards with Chart.js analytics
- Product approval workflow
- Review & rating system with moderation
- Stripe payment integration
- Glassmorphism UI (Vision UI inspired)

## Project Structure

marketplace/
├── backend/          # Django REST API
│   ├── accounts/     # Auth & user management
│   ├── vendors/      # Vendor profiles & payouts
│   ├── products/     # Product catalog
│   ├── orders/       # Cart, checkout, order distribution
│   ├── reviews/      # Reviews & moderation
│   └── analytics/    # Sales analytics
└── frontend/         # React + Vite
└── src/
├── pages/    # Buyer, Vendor, Admin pages
├── store/    # Redux + RTK Query
└── components/

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env         # Fill in your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env         # Fill in your values
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in your real values.  
**Never commit `.env` files.**

## Deployment

- **Backend:** Render (render.yaml included)
- **Frontend:** Vercel (vercel.json included)