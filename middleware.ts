import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Helper to get the correct URL with port
const getBaseUrl = (request: NextRequest) => {
  const host = request.headers.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = pathname.split('/').filter(Boolean).join('/');
  
  // Define public paths that don't require authentication
  const publicPaths = [
    'auth/signin', 
    'auth/error',
    'api/auth',
    '_next',
    'favicon.ico',
    'debug',
    'images'
  ];
  
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + "/")
  );
  
  console.log('Path:', path, '| Is public path:', isPublicPath);
  
  // Skip middleware for public paths
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Get the base URL with correct port
  const baseUrl = getBaseUrl(request);
  
  // Get the session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-for-development',
  });
  
  console.log('Session token exists:', !!token);
  
  // If no token and not a public path, redirect to signin
  if (!token) {
    console.log('No valid session, redirecting to signin');
    const signInUrl = new URL('/auth/signin', baseUrl);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // If user is on signin page but already authenticated, redirect to dashboard
  if (path === 'auth/signin') {
    console.log('Already authenticated, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', baseUrl));
  }
  
  // User is authenticated, proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|_next/data).*)',
  ],
};
