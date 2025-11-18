# Fix Vercel Build Error

## Problem
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path0/package.json'
```

## Solution

### Step 1: Check Vercel Project Settings

1. Go to your Vercel project dashboard
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. **IMPORTANT**: Make sure it's set to:
   - **Empty** (no value), OR
   - **`.`** (current directory)

   **DO NOT** set it to `frontend` - your repository IS already the frontend folder!

### Step 2: Verify Repository Structure

Your repository should have `package.json` at the root:
```
attendance_frontend/
├── package.json          ← Should be here
├── vercel.json
├── next.config.ts
├── app/
├── backend/
└── ...
```

### Step 3: Redeploy

1. After fixing the Root Directory setting
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or push a new commit to trigger automatic deployment

### Alternative: Delete and Re-import

If the above doesn't work:

1. Delete the project in Vercel
2. Create a new project
3. Import `kirubhel/attendance_frontend`
4. **DO NOT** set a root directory (leave it empty)
5. Add environment variables
6. Deploy

## Why This Happens

Vercel might have auto-detected a root directory incorrectly, or it was set manually to `frontend` when your repository IS already the frontend folder.

## Verification

After fixing, the build should show:
```
✓ Cloning github.com/kirubhel/attendance_frontend
✓ Running "npm install"
✓ Running "npm run build"
```

