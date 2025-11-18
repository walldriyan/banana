import 'next-auth';
import permissions from './permissions.json';

type Role = keyof typeof permissions.roles;

declare module 'next-auth' {
  /**
   * Extends the built-in session/user models to include custom properties
   */
  interface User {
    id: string;
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
