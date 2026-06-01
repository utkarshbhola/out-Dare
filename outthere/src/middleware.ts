import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Define public paths that unauthenticated users can access
  const isPublicPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth/callback');

  if (!user) {
    // If not logged in, and trying to access a protected path, redirect to login
    if (!isPublicPath) {
      url.pathname = '/login';
      // Pass the original path as a redirect parameter if relevant
      if (pathname !== '/login' && pathname !== '/signup') {
        url.searchParams.set('next', pathname);
      }
      return NextResponse.redirect(url);
    }
  } else {
    // User is logged in
    const isProfileCompleted = user.user_metadata?.profile_completed === true;

    if (!isProfileCompleted) {
      // If profile is incomplete, and they are not on the /onboarding page, redirect them to /onboarding
      if (pathname !== '/onboarding' && !pathname.startsWith('/auth/callback')) {
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    } else {
      // User is logged in AND profile is complete
      // If they try to access login, signup, or onboarding, redirect to discover
      if (
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/onboarding'
      ) {
        url.pathname = '/discover';
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets like images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
