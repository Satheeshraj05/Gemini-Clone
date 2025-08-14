import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=InvalidToken`
    );
  }

  try {
    // Find the user with the verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gt: new Date(), // Check if the token is still valid
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=InvalidOrExpiredToken`
      );
    }

    // Update the user to mark them as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Redirect to the sign-in page with a success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/signin?verified=true`
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=VerificationFailed`
    );
  }
}
