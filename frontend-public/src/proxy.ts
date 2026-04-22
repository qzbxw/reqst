import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

const locales = ['en', 'ru'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // IMPORTANT: Ignore system paths and the app namespace
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/app') || // Handled by Nginx
    pathname.includes('.')
  ) {
    return;
  }

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    // Redirect / to /en
    if (pathname === '/') {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }

    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}`, request.url)
    );
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) and static files
    '/((?!api|app|_next/static|_next/image|favicon.ico).*)',
  ],
};
