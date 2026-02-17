import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';

    // 1. Detect App Subdomain (app.cacontrol.online, app.localhost:3000, etc.)
    const isAppSubdomain = hostname.startsWith('app.') || hostname.includes('firmflow');

    if (isAppSubdomain) {
        // If they share the same deployment, we rewrite traffic to the /app folder
        // but keep the URL clean in the browser.

        // Skip static assets
        if (
            url.pathname.includes('.') ||
            url.pathname.startsWith('/_next') ||
            url.pathname.startsWith('/api')
        ) {
            return NextResponse.next();
        }

        // Rewrite everything to /app/...
        if (!url.pathname.startsWith('/app')) {
            url.pathname = `/app${url.pathname === '/' ? '' : url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    // 2. Redirect main-domain /app/* to the app subdomain (Production only)
    if (
        url.pathname.startsWith('/app') &&
        !isAppSubdomain &&
        hostname === 'cacontrol.online'
    ) {
        const newPath = url.pathname.replace('/app', '') || '/';
        return NextResponse.redirect(new URL(`https://app.cacontrol.online${newPath}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
