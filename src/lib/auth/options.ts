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

        if (username === superUsername && password === superPassword) {
            console.log('[authOptions] Super User authentication successful.');
            return {
                id: 'super_admin',
                name: 'Super Admin',
                username: superUsername,
                role: 'admin', // Super user is always an admin
                permissions: ['access_all'] // Super user gets all permissions
            };
        }

        // 2. Fallback to database user authentication
        const userFromDb = await findUserByUsername(username);

        if (!userFromDb) {
            console.log(`[authOptions] Database user "${username}" not found.`);
            return null;
        }

        // In a real app, you'd use bcrypt or another hashing library
        // const isPasswordValid = await verifyPassword(password, userFromDb.password);
        const isPasswordValid = password === userFromDb.password; // Plain text check for now

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
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // The 'user' object from authorize already has permissions calculated
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
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
