import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserPermissions, findUserRole } from './service';

export const authOptions: NextAuthOptions = {
  // Use JWT for sessions to keep it stateless
  session: {
    strategy: 'jwt',
  },
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
        // In a real app, you would look up the user in a database
        // and verify the password hash.
        // For this demo, we accept any username from our permissions file
        // with the password "password".
        const role = findUserRole(credentials.username);
        
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
      if (token) {
        session.user = {
          id: token.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: token.role,
          permissions: token.permissions,
        };
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
