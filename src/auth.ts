import NextAuth, { Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { JWT as DefaultJWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"

// Configuration for NextAuth
export const authOptions = {
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
  
  // Session configuration
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Secret for JWT signing
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-for-development',
  
  // Trust the host in development
  trustHost: true,
  
  // Pages configuration
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // Providers
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phoneNumber: { label: 'Phone Number', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
        countryCode: { label: 'Country Code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phoneNumber || typeof credentials.phoneNumber !== 'string' || !credentials.otp) {
            console.log('Missing required credentials');
            throw new Error('Phone number and OTP are required');
          }

          console.log('Authorizing user with phone number:', credentials.phoneNumber);
          
          // Verify OTP with Twilio
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: credentials.phoneNumber,
              code: credentials.otp
            })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error('OTP verification failed:', result.error);
            throw new Error(result.error || 'Invalid verification code');
          }
          
          // Create or find user in your database
          // For now, return a user object
          const user = {
            id: credentials.phoneNumber, // Use phone number as ID
            name: 'User',
            email: `${credentials.phoneNumber}@example.com`,
            phoneNumber: credentials.phoneNumber,
            role: 'user',
            isVerified: true,
            emailVerified: new Date()
          };
          
          return user;
          
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  
  // Callbacks with proper typing
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Debug log - remove in production
      if (process.env.NODE_ENV === 'development') {
        console.log('JWT callback:', { 
          hasUser: !!user,
          tokenSub: token.sub,
          userData: user 
        });
      }

      if (user) {
        // Add user data to the token
        token.user = {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          // Safely access custom properties with type checking
          phoneNumber: (user as any).phoneNumber ?? null,
          role: (user as any).role ?? 'user',
          isVerified: (user as any).isVerified ?? false
        };
      }
      
      return token;
    },
    
    async session({ session, token }: { session: Session; token: JWT & { user?: any } }) {
      // Add user data to the session
      if (token) {
        session.user = {
          ...session.user,
          id: token.sub, // Include user ID from token
          ...(token.user || {}) // Include any additional user data
        };
        
        // Debug log - remove in production
        if (process.env.NODE_ENV === 'development') {
          console.log('Session updated:', {
            hasToken: !!token,
            userId: token.sub,
            userData: token.user
          });
        }
      }
      return session;
    },
    
    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Handle relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Handle same origin
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch (e) {
        console.error('Invalid URL in redirect:', url);
      }
      return baseUrl;
    },
  },
  
  // Cookie settings
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

// Initialize NextAuth
const handler = NextAuth(authOptions);

export const { auth, signIn, signOut } = handler;
export default handler;
