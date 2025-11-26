import 'next-auth';

// No longer need permissions.json
// type Role = keyof typeof permissions.roles;
type Role = "admin" | "manager" | "cashier" | string; // Loosen the type

declare module 'next-auth' {
  /**
   * Extends the built-in session/user models to include custom properties
   */
  interface User {
    id: string;
    username: string; // Add username
    role: Role;
    permissions: string[];
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT model
   */
  interface JWT {
     id: string;
     role: Role;
     permissions: string[];
  }
}
