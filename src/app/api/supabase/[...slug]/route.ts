import { NextRequest } from 'next/server';

export const runtime = 'edge';

// We explicitly handle all methods that Supabase might use
export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }
export async function OPTIONS(req: NextRequest) { return handleProxy(req); }

async function handleProxy(req: NextRequest) {
    const supabaseUrl = process.env.SUPABASE_BACKEND_URL || 'https://ekartahcscinebxabmws.supabase.co';

    // Extract the exact path the client is trying to reach
    // e.g. /api/supabase/auth/v1/token -> /auth/v1/token
    const url = new URL(req.url);
    const targetPath = url.pathname.replace(/^\/api\/supabase/, '');

    // Construct the destination URL
    const targetUrl = `${supabaseUrl}${targetPath}${url.search}`;

    try {
        // We need to proxy the exact headers (especially Authorization and API keys)
        const headers = new Headers(req.headers);

        // Remove host header so fetch uses the new target host
        headers.delete('host');

        // Optional: Read the body if it's not a GET/HEAD
        let body = null;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await req.text();

            // Supabase auth often sends JSON, enforce it if the client forgot
            if (!headers.has('content-type') && body.startsWith('{')) {
                headers.set('content-type', 'application/json');
            }
        }

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: body,
            // Keep the same fetch behavior
            redirect: 'manual'
        });

        // Proxy back the exact response
        const responseHeaders = new Headers(response.headers);

        // Next.js Edge functions require valid response headers
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Supabase Proxy Error:', error);
        return new Response(JSON.stringify({ error: 'Proxy failed to connect to Supabase.' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
