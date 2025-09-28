import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const ROLE_PROTECTION = {
  '/admin': ['ADMIN'],
  '/admin/approvals': ['ADMIN'],
  '/portal': ['PATIENT'],
  '/clinician': ['CLINICIAN'],
  '/onboarding': ['PATIENT', 'CLINICIAN'], // Allow both during onboarding
} as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get('auth');
  if (!authCookie) {
    // Redirect to login for protected routes
    const protectedRoute = Object.keys(ROLE_PROTECTION).find(route =>
      pathname.startsWith(route)
    );

    if (protectedRoute) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  try {
    // Parse user data from cookie (in production, validate JWT)
    const userData = JSON.parse(decodeURIComponent(authCookie.value));

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_PROTECTION)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userData.role)) {
          // Redirect unauthorized users
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // Special handling for onboarding
        if (route === '/onboarding' && userData.role === 'PATIENT') {
          if (userData.patientState !== 'PROVISIONED' && userData.patientState !== 'ACTIVE') {
            return NextResponse.redirect(new URL('/verify', request.url));
          }
        }

        if (route === '/onboarding' && userData.role === 'CLINICIAN') {
          if (userData.clinicianState !== 'INVITED' && userData.clinicianState !== 'ACTIVE') {
            return NextResponse.redirect(new URL('/clinician', request.url));
          }
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid cookie data, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
