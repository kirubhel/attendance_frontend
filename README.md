# Attendance System - Frontend

Attendance & Student Management Platform - Frontend Application

Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- Admin Dashboard
- Course & Batch Registration
- Student Registration with QR Codes
- Attendance Tracking
- QR Code Scanner (Mobile-Responsive)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email@domain.com
CRON_SECRET=your_cron_secret
```

3. Create admin user:
```bash
node scripts/create-admin.js
```

4. Run development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See main README.md for full documentation.
