# Vercel Deployment Guide

## Prerequisites
- GitHub repository with your code
- Vercel account (free tier works)
- MongoDB Atlas cluster running

## Step 1: Push to GitHub

If you haven't already:
```bash
cd frontend
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (if your repo has frontend folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Option B: Via Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel
```

Follow the prompts to deploy.

## Step 3: Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables:
```
MONGODB_URI=mongodb+srv://kirub:P%40ssw0rd@ercs-cluster.z7bgqce.mongodb.net/attendance?appName=ERCS-Cluster&retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here (generate a strong random string)
NODE_ENV=production
```

### Email Configuration (SMTP):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=kirub.hel@gmail.com
SMTP_PASSWORD=dqys bnjk hhny khbk
SMTP_FROM=noreply@tucanbit.com
SMTP_FROM_NAME=Attendance System
SMTP_USE_TLS=true
```

### Optional (for Cron Jobs):
```
CRON_SECRET=your-cron-secret-here
```

**Important**: 
- Replace `your-secret-key-here` with a strong random string (you can generate one with: `openssl rand -base64 32`)
- Make sure to add these to **Production**, **Preview**, and **Development** environments

## Step 4: Configure Cron Job

The cron job for checking absences is configured in `vercel.json` to run daily at midnight UTC.

To manually trigger for testing:
```
GET https://your-app.vercel.app/api/cron/check-absence
```

## Step 5: Seed Admin User

After deployment, you can seed the admin user by:

1. Using Vercel CLI:
```bash
vercel env pull .env.local
node scripts/seed-admin.js
```

2. Or create a one-time API endpoint to seed (remove after use)

## Step 6: Network Access

Make sure your MongoDB Atlas Network Access allows:
- Vercel IPs (or use `0.0.0.0/0` for development)
- Your IP address for local development

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure `next.config.ts` is properly configured
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `MONGODB_URI` is correct in Vercel environment variables
- Check MongoDB Atlas Network Access settings
- Ensure cluster is running (not paused)

### Cron Job Not Running
- Verify `vercel.json` is in the root directory
- Check Vercel Cron Jobs section in dashboard
- Ensure the endpoint is accessible

## Post-Deployment

1. Test the application at your Vercel URL
2. Test login with admin credentials
3. Test creating a course, batch, and student
4. Verify email sending works
5. Check cron job execution in Vercel dashboard

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

