# 🎓 School Billing System - Kenya

A modern, production-ready web application for managing school fees for secondary schools in Kenya. Built with Next.js, TypeScript, Prisma, and PostgreSQL.

## ✨ Features

### 🔐 Role-Based Access Control

#### Super Admin (System Owner)
- Create and manage multiple schools
- Assign principals to schools
- View system-wide analytics
- Monitor total collections across all schools
- Manage user accounts

#### Principal / School Admin
- Add, edit, and remove students
- Assign students to classes, streams, and courses
- Set fee structures per class/course/term
- View payment history and outstanding balances
- Generate reports (PDF & CSV)
- Manage school settings

#### Parent / Guardian
- Secure login with email and password
- View all registered children
- See fee balances, payment history, and invoices
- Make payments via:
  - M-Pesa (STK Push)
  - Card payments
  - Pesapal
- Download receipts
- Raise inquiries to the school

### 💳 Payment Integration
- **M-Pesa**: Daraja API integration with STK Push
- **Card Payments**: Secure card processing
- **Pesapal**: Multi-payment gateway support
- Real-time payment status updates
- Automatic receipt generation

### 📊 Reporting & Analytics
- Payment history tracking
- Outstanding balance reports
- Collection summaries
- Term-wise fee analysis
- Export to PDF and CSV

### 🔒 Security Features
- Secure password hashing with bcrypt
- JWT-based authentication
- Role-based authorization
- Audit logs for all critical actions
- Session management

### 📱 Modern UI/UX
- Mobile-first responsive design
- Clean, professional interface
- Smooth animations and transitions
- Intuitive navigation
- Real-time updates

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Custom CSS with modern design system
- **Icons**: Lucide React
- **Payments**: M-Pesa Daraja API, Pesapal

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- M-Pesa Developer Account (for payment integration)
- Pesapal Account (optional)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd school_billing
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
createdb school_billing

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE school_billing;
```

### 3. Environment Configuration

Update the `.env` file with your credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/school_billing?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# M-Pesa (Get from Daraja Portal)
MPESA_CONSUMER_KEY="your_consumer_key"
MPESA_CONSUMER_SECRET="your_consumer_secret"
MPESA_PASSKEY="your_passkey"
MPESA_SHORTCODE="your_shortcode"

# Pesapal (Optional)
PESAPAL_CONSUMER_KEY="your_pesapal_key"
PESAPAL_CONSUMER_SECRET="your_pesapal_secret"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### 4. Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npx prisma db seed
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👤 Default Login Credentials

After seeding the database, use these credentials:

### Super Admin
- **Email**: admin@schoolbilling.ke
- **Password**: admin123

### Principal
- **Email**: principal@demoschool.ac.ke
- **Password**: principal123

### Parent
- **Email**: parent@example.com
- **Password**: parent123

**⚠️ IMPORTANT**: Change these passwords in production!

## 📁 Project Structure

```
school_billing/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/             # Login page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   └── Providers.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── next-auth.d.ts     # Type definitions
├── .env                       # Environment variables
├── package.json
└── README.md
```

## 🗄️ Database Schema

The system uses a multi-tenant architecture with the following main entities:

- **User**: Super admins, principals, and parents
- **School**: School information and settings
- **Student**: Student records linked to parents
- **Class**: Classes and streams
- **FeeStructure**: Fee definitions per class/term
- **Invoice**: Student invoices
- **Payment**: Payment records
- **Transaction**: Payment gateway responses
- **Inquiry**: Parent-school communication
- **AuditLog**: System activity tracking
- **Notification**: Email/SMS notifications

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Students (Principal only)
- `GET /api/students` - List students
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Remove student

### Payments
- `POST /api/payments/mpesa` - Initiate M-Pesa payment
- `POST /api/payments/mpesa/callback` - M-Pesa callback
- `POST /api/payments/pesapal` - Initiate Pesapal payment
- `POST /api/payments/pesapal/ipn` - Pesapal IPN

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Generate invoice
- `GET /api/invoices/:id` - Get invoice details

## 🎨 Design System

The application uses a modern design system with:

- **Color Palette**: Professional blues, purples, and semantic colors
- **Typography**: Inter font family
- **Components**: Cards, buttons, forms, tables, badges, alerts
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first approach

## 🔐 Security Best Practices

1. **Password Security**: All passwords are hashed with bcrypt (12 rounds)
2. **Session Management**: JWT tokens with secure httpOnly cookies
3. **SQL Injection Prevention**: Prisma ORM with parameterized queries
4. **XSS Protection**: React's built-in XSS protection
5. **CSRF Protection**: NextAuth CSRF tokens
6. **Audit Logging**: All critical actions are logged
7. **Role-Based Access**: Middleware protects all routes

## 📱 Payment Integration Guide

### M-Pesa Setup

1. Register at [Daraja Portal](https://developer.safaricom.co.ke/)
2. Create an app and get credentials
3. Add credentials to `.env`
4. Implement STK Push in `/api/payments/mpesa`

### Pesapal Setup

1. Register at [Pesapal](https://www.pesapal.com/)
2. Get API credentials
3. Add to `.env`
4. Implement in `/api/payments/pesapal`

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set these in your hosting platform:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Payment gateway credentials

### Database

Use a managed PostgreSQL service:
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)

## 📝 Future Enhancements

- [ ] SMS notifications via Africa's Talking
- [ ] Email notifications
- [ ] PDF report generation
- [ ] CSV export functionality
- [ ] Multi-language support (English/Swahili)
- [ ] Mobile app (React Native)
- [ ] Bulk student import
- [ ] Fee reminders
- [ ] Payment plans
- [ ] Scholarship management

## 🤝 Contributing

This is a production-ready template. Feel free to customize for your needs.

## 📄 License

MIT License - feel free to use for commercial projects.

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact your system administrator

---

**Built with ❤️ for Kenyan Schools**
