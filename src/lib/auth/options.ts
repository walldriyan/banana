// src/lib/auth/options.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserPermissions, findUserByUsername, verifyPassword } from './service';
import { prisma } from '../prisma';

console.log('[authOptions] File loaded.');
console.log('[authOptions] NEXTAUTH_SECRET from env:', process.env.NEXTAUTH_SECRET ? 'Loaded' : 'NOT LOADED');


export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-super-secret-key-for-development-if-env-is-not-set',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[authOptions] Authorize function called with credentials:', credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          console.log('[authOptions] Authorize failed: Missing username or password.');
          return null;
        }
        
        const { username, password } = credentials;

        // 1. Check for Super User from .env
        const superUsername = process.env.SUPER_USER_USERNAME;
        const superPassword = process.env.SUPER_USER_PASSWORD;

        if (superUsername && superPassword && username === superUsername && password === superPassword) {
            console.log('[authOptions] Super User authentication successful.');
            // This user object is self-contained and doesn't need a DB lookup.
            return {
                id: 'super_admin',
                name: 'Super Admin',
                username: superUsername,
                role: 'admin',
                permissions: ['access_all'] // Super user gets all permissions directly.
            };
        }

        // 2. Fallback to database user authentication
        const userFromDb = await findUserByUsername(username);

        if (!userFromDb) {
            console.log(`[authOptions] Database user "${username}" not found.`);
            return null;
        }

        const isPasswordValid = password === userFromDb.password; 

        if (isPasswordValid) {
            console.log(`[authOptions] Database user "${username}" authenticated successfully.`);
            const permissions = await getUserPermissions({ id: userFromDb.id, role: userFromDb.role.name });
            return {
                id: userFromDb.id,
                username: userFromDb.username,
                name: userFromDb.name,
                role: userFromDb.role.name,
                permissions: permissions
            };
        }
        
        console.log(`[authOptions] Invalid password for database user "${username}".`);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // The 'user' object is only available on the first sign-in.
      // Subsequent calls will only have the 'token' object.
      if (user) {
        // Persist the custom data from the user object to the token
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the custom data from the token to the client-side session object
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
};
