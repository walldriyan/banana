// src/lib/auth/options.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserPermissions, findUserByUsername } from './service';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-super-secret-key-for-development-if-env-is-not-set',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // useSecureCookies: false is not needed if NEXTAUTH_URL is correctly set for http
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        const { username, password } = credentials;

        const superUsername = process.env.SUPER_USER_USERNAME;
        const superPassword = process.env.SUPER_USER_PASSWORD;

        if (superUsername && superPassword && username === superUsername && password === superPassword) {
          console.log('[AUTH] Super Admin login successful.');
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
          console.log(`[AUTH] User not found: ${username}`);
          return null;
        }
        
        const isPasswordValid = password === userFromDb.password;

        if (isPasswordValid) {
          const permissions = await getUserPermissions({ id: userFromDb.id, role: userFromDb.role.name });
           console.log(`[AUTH] DB User login successful: ${username}`);
          return {
            id: userFromDb.id,
            username: userFromDb.username,
            name: userFromDb.name,
            role: userFromDb.role.name,
            permissions: permissions
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.permissions = token.permissions as string[];
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
