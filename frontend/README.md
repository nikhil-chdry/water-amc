#  Water AMC Management System

A full-stack web application to manage water solution business — customers, AMC tracking, service visits, payments and AI insights.

##  Features

- **Customer Management** — Add, edit, delete customers with full profile
- **AMC Tracking** — Track Annual Maintenance Contracts with auto status (Active/Expiring/Expired)
- **Service Visits** — Log technician visits with AI complaint categorization
- **Payments** — Track AMC payments, installation charges, split payments, dues
- **Reports** — Monthly revenue charts, AMC status breakdown, product analytics
- **AI Insights** — Churn risk scoring, revenue forecasting, complaint analysis
- **WhatsApp + Email** — Send AMC reminders directly to customers
- **Bill Upload** — Capture and store handwritten bills as photos
- **Global Search** — Search customers, payments, visits instantly
- **Multi-user** — Each user sees only their own business data
- **Mobile Responsive** — Works on phone, tablet, desktop

##  Tech Stack

**Frontend:** React + Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide Icons

**Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT Auth, Multer, Nodemailer, Node-cron

##  Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free)
- Gmail account with App Password

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
See `backend/.env.example` for required variables.

##  Usage

1. Register an account at `localhost:5173/login`
2. Add your first customer
3. Track AMC dates and payments
4. Use AI Insights to identify at-risk customers

##  Project Structure
water-amc/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/       # Auth + file upload
│   ├── utils/           # Email, reminders, AI analyzer
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth + Data context
│   │   └── api.js       # All API calls
│   └── index.html
└── README.md
## 👨 Built By

Built as a real-world project for a water solutions business in sikar, Rajasthan.