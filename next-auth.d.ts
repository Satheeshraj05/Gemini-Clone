import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      phoneNumber?: string | null;
      image?: string | null;
      role?: string;
      isVerified: boolean;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    email: string;  // Made non-nullable to match AdapterUser
    name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
    role?: string;
    isVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id: string;
    email: string;  // Made non-nullable to match AdapterUser
    name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
    role?: string;
    isVerified: boolean;
  }
}
