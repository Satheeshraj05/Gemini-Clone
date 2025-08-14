import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      phoneNumber?: string | null;
      image?: string | null;
      role?: string;
      isVerified: boolean;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    email?: string | null;
    name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
    role?: string;
    isVerified: boolean;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
    role?: string;
    isVerified: boolean;
  }
  interface JWT {
    id: string;
    phoneNumber?: string | null;
    role?: string;
    isVerified: boolean;
  }
}
