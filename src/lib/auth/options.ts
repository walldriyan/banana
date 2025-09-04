import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserPermissions, findUserRole } from './service';

export const authOptions: NextAuthOptions = {
  // Use JWT for sessions to keep it stateless
  session: {
    strategy: 'jwt',
  },
  // A secret is required for JWT sessions.
  // In a real production app, this should be a long, random string
  // set in your environment variables via .env.local or your hosting provider.
  // SINHALA COMMENT:
  // Production (සැබෑ යෙදුම) සඳහා, මෙම NEXTAUTH_SECRET අගය, ඔබගේ hosting provider එකේ (උදා: Vercel, Firebase)
  // environment variable එකක් ලෙස, ඉතාමත් ආරක්ෂිත, දිගු, අහඹු අක්ෂර මාලාවක් ලෙස සැකසිය යුතුය.
  // Development (සංවර්ධන) පරිසරය සඳහා, අපි .env.local ගොනුවේ ඇති අගය හෝ පහත fallback අගය භාවිතා කරමු.
  secret: process.env.NEXTAUTH_SECRET || 'fallback-super-secret-key-for-development-if-env-is-not-set',
  // Define authentication providers
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

        // --- DUMMY USER AUTHENTICATION ---
        // SINHALA COMMENT:
        // Development (සංවර්ධන) පරිසරය සඳහා, අපි මෙහි තාවකාලික (dummy) user-ලොග්-වීමේ තර්කනයක් භාවිතා කරමු.
        // Production (සැබෑ යෙදුම) සඳහා, මෙතැනදී, ඔබගේ සැබෑ දත්ත ගබඩාව (database) වෙත request එකක් යවා,
        // පරිශීලකයා සහ මුරපදය (password hash) නිවැරදිදැයි පරීක්ෂා කළ යුතුය.
        const role = await findUserRole(credentials.username);
        
        // For any dummy user, the password is 'password'
        if (role && credentials.password === 'password') {
          const user = {
            id: credentials.username,
            name: credentials.username.replace('_', ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), // e.g., "Cashier User"
            role: role,
            permissions: [] // Permissions will be added in the jwt callback
          };
          return user;
        }
        // --- END DUMMY USER AUTHENTICATION ---

        // If authentication fails
        return null;
      },
    }),
  ],
  // Callbacks are used to control what happens at each step of the auth process
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    // We add the user's role and permissions to the token.
    async jwt({ token, user }) {
      if (user) {
        // On initial sign in, the `user` object is available
        token.id = user.id;
        token.role = user.role;
        // Fetch and add permissions to the token
        token.permissions = await getUserPermissions(user);
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    // We transfer the data from the JWT to the session object.
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  // Define custom pages
  pages: {
    signIn: '/login',
    error: '/login', // Redirect users to login page on error
  },
};
