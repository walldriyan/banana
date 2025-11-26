# Fix for Next-Auth CLIENT_FETCH_ERROR

## Problem
The error `[next-auth][error][CLIENT_FETCH_ERROR]` occurs because Next-Auth cannot properly construct the API endpoint URL.

## Root Cause
Missing `NEXTAUTH_URL` environment variable, which is **required** when running on a non-standard port (9002).

## Solution

### Step 1: Update your `.env.local` file

Add the following environment variables to your `.env.local` file:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Next-Auth Configuration (CRITICAL - Required for Next-Auth to work)
NEXTAUTH_URL="http://localhost:9002"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Super Admin Credentials
SUPER_USER_USERNAME="admin"
SUPER_USER_PASSWORD="admin123"

# App Mode: "web" or "desktop"
NEXT_PUBLIC_APP_MODE=web

# Desktop specific settings (only used in desktop mode)
NEXT_PUBLIC_SILENT_PRINT_ENABLED=false

# Google AI (if using Genkit)
GOOGLE_GENAI_API_KEY=""
```

### Step 2: Update your `.env` file (if you have one)

Make sure your `.env` file also has:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:9002"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
```

### Step 3: Restart your development server

After updating the environment files:

1. Stop your current dev server (Ctrl+C)
2. Run `npm run dev` again
3. The Next-Auth error should be resolved

## Why This Happens

- **NEXTAUTH_URL**: Tells Next-Auth what URL to use for API callbacks. Without it, Next-Auth tries to auto-detect the URL, which fails in certain environments (Turbopack, proxies, non-standard ports)
- **NEXTAUTH_SECRET**: Used to encrypt JWT tokens and session data. While you have a fallback in `options.ts`, it's better to set it explicitly

## Additional Notes

- The `NEXTAUTH_SECRET` should be a random string in production
- Generate a secure secret with: `openssl rand -base64 32`
- For production, always use HTTPS: `NEXTAUTH_URL="https://yourdomain.com"`

## Verification

After applying the fix, you should see:
- No more CLIENT_FETCH_ERROR in the console
- Next-Auth API routes accessible at `http://localhost:9002/api/auth/*`
- Login functionality working properly
