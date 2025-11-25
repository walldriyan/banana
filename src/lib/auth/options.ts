// src/lib/auth/options.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserPermissions, findUserByUsername, verifyPassword } from './service';
import { prisma } from '../prisma';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-super-secret-key-for-development-if-env-is-not-set',
  useSecureCookies: false, // Recommended for development, esp. in proxied/iframe environments
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log(`[AUTH FLOW 1/4 - Authorize] 🔑 පරිශීලකයා login වීමට උත්සාහ කරයි: ${credentials?.username}`);

        if (!credentials?.username || !credentials?.password) {
          console.error('[AUTH FLOW 1/4 - Authorize] ❌ දෝෂය: Username හෝ Password ඇතුළත් කර නැත.');
          return null;
        }
        
        const { username, password } = credentials;

        const superUsername = process.env.SUPER_USER_USERNAME;
        const superPassword = process.env.SUPER_USER_PASSWORD;

        if (superUsername && superPassword && username === superUsername && password === superPassword) {
            console.log('[AUTH FLOW 1/4 - Authorize] ✅ සාර්ථකයි: Super Admin ලෙස හඳුනාගත්තා.');
            return {
                id: 'super_admin',
                name: 'Super Admin',
                username: superUsername,
                role: 'admin',
                permissions: ['access_all']
            };
        }

        const userFromDb = await findUserByUsername(username);

        if (!userFromDb) {
            console.warn(`[AUTH FLOW 1/4 - Authorize] ❌ අසාර්ථකයි: "${username}" නමින් පරිශීලකයෙක් database එකේ නැත.`);
            return null;
        }

        const isPasswordValid = password === userFromDb.password; 

        if (isPasswordValid) {
            const permissions = await getUserPermissions({ id: userFromDb.id, role: userFromDb.role.name });
            console.log(`[AUTH FLOW 1/4 - Authorize] ✅ සාර්ථකයි: Database පරිශීලක "${username}" හඳුනාගත්තා.`);
            return {
                id: userFromDb.id,
                username: userFromDb.username,
                name: userFromDb.name,
                role: userFromDb.role.name,
                permissions: permissions
            };
        }
        
        console.warn(`[AUTH FLOW 1/4 - Authorize] ❌ අසාර්ථකයි: "${username}" ගේ password එක වැරදියි.`);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log(`[AUTH FLOW 2/4 - JWT Callback] 📝 JWT token එක නිර්මාණය වෙමින් පවතී...`);
      // The 'user' object is only available on the first sign-in.
      if (user) {
        console.log('[AUTH FLOW 2/4 - JWT Callback] 👉 පළමු login වීම. User object එකෙන් දත්ත token එකට දමයි.', user);
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      } else {
        console.log('[AUTH FLOW 2/4 - JWT Callback] 👉 දැනටමත් login වී ඇත. පවතින token එක භාවිතා කරයි.');
      }
       console.log('[AUTH FLOW 2/4 - JWT Callback] ✅ අවසන් වූ JWT token එක:', token);
      return token;
    },
    async session({ session, token }) {
      console.log(`[AUTH FLOW 3/4 - Session Callback] 🙋‍♂️ Client-side session object එක නිර්මාණය වෙමින් පවතී...`);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.permissions = token.permissions as string[];
        console.log(`[AUTH FLOW 3/4 - Session Callback] ✅ Token එකේ දත්ත session එකට සාර්ථකව එක් කලා.`);
      } else {
         console.warn(`[AUTH FLOW 3/4 - Session Callback] ⚠️ Token හෝ session.user නොමැත.`);
      }
      console.log('[AUTH FLOW 3/4 - Session Callback] ✅ අවසන් වූ Client-side session object එක:', session);
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
};
