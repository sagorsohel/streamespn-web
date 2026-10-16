import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { filterIgnoredParams } from './lib/ignoredParams';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip Next.js internals, API proxy routes, and static asset files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // If request contains query parameters, check if any should be ignored
  if (searchParams && Array.from(searchParams.keys()).length > 0) {
    const { hasIgnored, cleanParams } = filterIgnoredParams(searchParams);

    if (hasIgnored) {
      const cleanUrl = request.nextUrl.clone();
      const queryString = cleanParams.toString();
      cleanUrl.search = queryString ? `?${queryString}` : '';

      return NextResponse.rewrite(cleanUrl);
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
