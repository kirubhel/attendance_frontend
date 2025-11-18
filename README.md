# Attendance System - Frontend

Modern attendance and student management platform built with Next.js 16.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (backend endpoints)
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Registration pages
│   └── ...
├── backend/               # Backend models and utilities
│   ├── models/           # Database models
│   ├── utils/            # Utilities (auth, db, email, etc.)
│   └── types/             # TypeScript types
├── components/            # React components
├── lib/                   # Client-side utilities
└── scripts/               # Utility scripts
```

## Features

- ✅ Course scheduling with different times per weekday
- ✅ Student registration with QR code generation
- ✅ QR code scanning for attendance
- ✅ Automatic absence tracking and email notifications
- ✅ Student ranking based on attendance hours
- ✅ Mobile-responsive design
- ✅ Toast notifications
- ✅ Professional dashboard UI

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and other configs
```

### Environment Variables

Create `.env.local` with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Attendance System
SMTP_USE_TLS=true
```

### Development

```bash
# Start development server
npm run dev

# Seed admin user
npm run seed:admin

# Test database connection
npm run test:db
```

### Build

```bash
npm run build
npm start
```

## Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## API Routes

All API routes are in `app/api/`:

- `/api/auth/login` - Admin login
- `/api/courses` - Course management
- `/api/batches` - Batch management
- `/api/students` - Student management
- `/api/attendance` - Attendance tracking
- `/api/qr/scan` - QR code scanning
- `/api/cron/check-absence` - Daily absence check (cron)
- `/api/students/ranking` - Student rankings

## Admin Credentials

Default admin user (after seeding):
- Username: `nardi`
- Password: `P@ssw0rd`

**⚠️ Change these in production!**

## License

MIT
