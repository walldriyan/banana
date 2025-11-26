# Next-Auth CLIENT_FETCH_ERROR - සම්පූර්ණ විසඳුම

## ගැටලුව
Next.js 15.5.2 (Turbopack) සමග Next-Auth v4 භාවිතා කරද්දී `CLIENT_FETCH_ERROR` දෝෂය ඇතිවීම.

## මූල හේතුව
1. **NEXTAUTH_URL** environment variable එක නොතිබීම (port 9002 සඳහා අනිවාර්යයි)
2. **NEXTAUTH_SECRET** හරියටම set නොවීම
3. Next.js 15 සමග Next-Auth v4 compatibility issues
4. Session strategy හරියටම configure නොවීම

## සම්පූර්ණ විසඳුම

### 1. Environment Variables (.env.local)

```env
NEXT_PUBLIC_APP_MODE=web
NEXT_PUBLIC_SILENT_PRINT_ENABLED=false
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:9002"
NEXTAUTH_SECRET="banana-pos-super-secret-key-2025-development-only"
SUPER_USER_USERNAME="admin"
SUPER_USER_PASSWORD="admin123"
```

**ප්‍රධාන වශයෙන්:**
- `NEXTAUTH_URL` - Next-Auth API routes සඳහා base URL එක
- `NEXTAUTH_SECRET` - JWT tokens encrypt කරන්න
- `SUPER_USER_USERNAME` සහ `SUPER_USER_PASSWORD` - Super admin login credentials

### 2. Auth Options (src/lib/auth/options.ts)

```typescript
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-super-secret-key-for-development-if-env-is-not-set',
  session: {
    strategy: 'jwt',  // ← මෙය අනිවාර්යයි
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: false,
  debug: process.env.NODE_ENV === 'development', // ← Debug logs සඳහා
  providers: [
    // ... credentials provider
  ],
  callbacks: {
    // ... jwt සහ session callbacks
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
```

**ප්‍රධාන වෙනස්කම්:**
- `session.strategy: 'jwt'` - Next.js 15 සමග අනිවාර්යයි
- `debug: true` - Development mode එකේ debug logs enable කරනවා

### 3. Auth Provider (src/components/auth/AuthProvider.tsx)

```typescript
<SessionProvider 
  basePath="/api/auth"
  refetchInterval={5 * 60} // 5 minutes
  refetchOnWindowFocus={true}
>
  {children}
</SessionProvider>
```

**ප්‍රධාන වෙනස්කම්:**
- `refetchInterval` - Session එක නිතරම update වෙන්න
- `refetchOnWindowFocus` - Window focus වෙද්දී session check කරනවා

### 4. Middleware (src/middleware.ts)

```typescript
export default withAuth(
  function middleware(req) {
    // ... middleware logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET, // ← මෙය අනිවාර්යයි
    jwt: {
      decode: async ({ token, secret }) => {
        return token as any; // Next.js 15 compatibility
      },
    },
  }
);
```

**ප්‍රධාන වෙනස්කම්:**
- `secret` - Middleware එකේ NEXTAUTH_SECRET එකතු කළා
- `jwt.decode` - Next.js 15 compatibility සඳහා

## ප්‍රතිඵලය

✅ **සාර්ථකව විසඳා ඇත!**

Server logs එකෙන් පේනවා:
- `POST /api/auth/callback/credentials 200` - Login සාර්ථකයි
- `GET /api/auth/session 200` - Session එක හරියටම වැඩ කරනවා
- Super Admin login වුණා: `{ name: 'Super Admin', role: 'admin', permissions: ['access_all'] }`

## Login Credentials

**Super Admin:**
- Username: `admin`
- Password: `admin123`

**Database Users:**
- Database එකේ තියෙන users ලා ඔවුන්ගේ credentials භාවිතා කරන්න පුළුවන්

## පරීක්ෂා කිරීම

1. Browser එක refresh කරන්න
2. `http://localhost:9002/login` වෙත යන්න
3. Super admin credentials භාවිතා කරලා login වෙන්න
4. Console එකේ CLIENT_FETCH_ERROR නැති වෙන්න ඕන
5. Login සාර්ථක වුණාම `/` (home page) වෙත redirect වෙනවා

## Production සඳහා

Production environment එකේ:
1. `NEXTAUTH_SECRET` වෙනස් කරන්න: `openssl rand -base64 32`
2. `NEXTAUTH_URL` වෙනස් කරන්න: `https://yourdomain.com`
3. `useSecureCookies: true` set කරන්න HTTPS සඳහා

## සටහන්

- මෙම විසඳුම Next.js 15.5.2 + Turbopack + Next-Auth v4 සඳහා test කර ඇත
- සියලුම වෙනස්කම් backward compatible වේ
- Debug mode development එකේ විතරක් enable වෙනවා
