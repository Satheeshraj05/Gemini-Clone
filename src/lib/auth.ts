import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, User } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define the shape of the user data we'll be working with
type AuthUser = {
  id: string;  // id is always required and non-nullable
  name: string | null;
  email: string | null;
  emailVerified: Date | null;  // Required by AdapterUser
  image: string | null;
  phoneNumber: string | null;
  role: string;  // role is required with a default value
  isVerified: boolean;
};

// Define the user select fields type
type UserSelect = {
  id: boolean;
  name: boolean;
  email: boolean;
  image: boolean;
  phoneNumber: boolean;
  role: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  verificationToken: boolean;
  verificationTokenExpires: boolean;
};

// Using the types from next-auth.d.ts

// Custom user type that matches NextAuth's expected user structure with our custom fields
interface CustomUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  phoneNumber: string | null;
  role: string;
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpires: Date | null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  // Configure custom pages
  pages: {
    signIn: '/auth/signin',  // Custom sign in page
    error: '/auth/error',    // Error code passed in query string as ?error=
  },
  // Use JWT-based sessions so middleware getToken works
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Phone",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        countryCode: { label: "Country Code", type: "text" },
        otp: { label: "Verification Code", type: "text" },
      } as const,
      async authorize(credentials, req) {
        try {
          // Type assertion for credentials
          const creds = credentials as { phoneNumber?: string; countryCode?: string; otp?: string };
          
          if (!creds?.phoneNumber) {
            throw new Error('Phone number is required');
          }

          const fullPhoneNumber = `${creds.countryCode || ''}${creds.phoneNumber}`.replace(/\D/g, '');

          // In a real app, you would verify the OTP here
          if (creds.otp && !/^\d{6}$/.test(creds.otp)) {
            throw new Error("Invalid verification code");
          }

        try {
          // First, try to find an existing user by phone number
          // Find user by phone number using a raw query to avoid type issues
          const users = await prisma.$queryRaw<Array<{
            id: string;
            name: string | null;
            email: string | null;
            emailVerified: Date | null;
            image: string | null;
            phoneNumber: string | null;
            role: string | null;
            isVerified: boolean | null;
            verificationToken: string | null;
            verificationTokenExpires: Date | null;
          }>>`
            SELECT * FROM users WHERE phoneNumber = ${fullPhoneNumber} LIMIT 1
          `;
          
          const existingUser = users[0];

          if (existingUser) {
            return {
              id: existingUser.id,
              name: existingUser.name,
              // Ensure a non-empty email to satisfy callbacks and session requirements
              email: existingUser.email && existingUser.email.trim() !== ''
                ? existingUser.email
                : `${fullPhoneNumber}@example.com`,
              emailVerified: existingUser.emailVerified ? new Date(existingUser.emailVerified) : null,
              image: existingUser.image,
              phoneNumber: existingUser.phoneNumber || fullPhoneNumber,
              role: existingUser.role || 'user',
              isVerified: Boolean(existingUser.isVerified),
              verificationToken: existingUser.verificationToken || null,
              verificationTokenExpires: existingUser.verificationTokenExpires
                ? new Date(existingUser.verificationTokenExpires)
                : null,
            };
          }

          // Create new user if not found
          // Create new user using a raw query to avoid type issues
          const newUsers = await prisma.$queryRaw<Array<{
            id: string;
            name: string | null;
            email: string | null;
            emailVerified: Date | null;
            image: string | null;
            phoneNumber: string | null;
            role: string | null;
            isVerified: boolean | null;
            verificationToken: string | null;
            verificationTokenExpires: Date | null;
          }>>`
            INSERT INTO users (
              id, name, email, phoneNumber, isVerified, role
            ) VALUES (
              ${crypto.randomUUID()},
              ${`User-${Math.random().toString(36).substring(2, 10)}`},
              ${`${fullPhoneNumber}@example.com`},
              ${fullPhoneNumber},
              true,
              'user'
            ) RETURNING *
          `;
          
          const newUser = newUsers[0];

          // Ensure we have a valid user
          if (!newUser) {
            throw new Error('Failed to create user');
          }

          // Map the user data to match NextAuth's User type
          const user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email || '',
            emailVerified: newUser.emailVerified ? new Date(newUser.emailVerified) : null,
            image: newUser.image,
            phoneNumber: newUser.phoneNumber || fullPhoneNumber,
            role: newUser.role || 'user',
            isVerified: Boolean(newUser.isVerified),
            verificationToken: newUser.verificationToken || null,
            verificationTokenExpires: newUser.verificationTokenExpires
              ? new Date(newUser.verificationTokenExpires)
              : null,
          };

          // Return null if user creation failed
          return user || null;
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
        } catch (error) {
          console.error('Authentication error:', error);
          // Return null to indicate authentication failure
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      if (session.user) {
        // Ensure all required fields are present and properly typed
        if (!token.id) {
          throw new Error('User ID is missing from token');
        }
        
        if (!token.email) {
          throw new Error('Email is required for the session');
        }
        
        // Create a new user object with proper typing
        const user: AuthUser = {
          id: String(token.id),
          name: token.name || null,
          email: token.email, // Now guaranteed to be a string
          emailVerified: token.emailVerified instanceof Date ? token.emailVerified : null,
          image: token.picture || null,
          phoneNumber: token.phoneNumber || null,
          role: (token.role as string) || 'user',
          isVerified: !!token.isVerified
        };
        
        // Merge with existing session user to preserve any additional fields
        session.user = {
          ...session.user,
          ...user
        } as AuthUser & DefaultSession['user']; // Type assertion to ensure type safety
      }
      return session;
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        if (!user.email) {
          throw new Error('Email is required for authentication');
        }
        
        token.id = user.id || '';
        token.name = user.name || null;
        token.email = user.email; // Now guaranteed to be a string
        token.picture = user.image || null;
        token.phoneNumber = user.phoneNumber || null;
        token.role = user.role || 'user';
        token.isVerified = user.isVerified || false;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Enable debug logs in development
  logger: {
    error(error: Error) {
      console.error({ type: 'error', error });
    },
    warn(code: string) {
      console.warn({ type: 'warn', code });
    },
    debug(message: string, metadata?: any) {
      console.log({ type: 'debug', message, metadata });
    },
  },
});
