/**
 * Environment-safe utilities for checking development mode
 * and other environment variables across Vite and Next.js.
 */

export const isDev = (): boolean => {
    // Check process.env (Next.js/Node)
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        return true;
    }

    // Check import.meta.env (Vite)
    try {
        return (import.meta as any).env?.DEV === true;
    } catch (e) {
        // If import.meta is not supported or env is missing
    }

    // Fallback to localhost check
    if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    return false;
};

export const getEnvVar = (viteName: string, nextName?: string): string | undefined => {
    // 1. Literal checks for Next.js client-side (required because dynamic process.env[name] fails on client)
    if (nextName === 'NEXT_PUBLIC_SUPABASE_URL') {
        const val = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (val) return val;
    }
    if (nextName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        const val = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (val) return val;
    }
    if (nextName === 'NEXT_PUBLIC_APP_URL') {
        const val = process.env.NEXT_PUBLIC_APP_URL;
        if (val) return val;
    }
    if (nextName === 'NEXT_PUBLIC_API_URL') {
        const val = process.env.NEXT_PUBLIC_API_URL;
        if (val) return val;
    }

    // 2. Server-side or Node environment dynamic check
    if (typeof process !== 'undefined') {
        const nextVal = nextName ? process.env[nextName] : undefined;
        if (nextVal) return nextVal;

        const viteVal = process.env[viteName];
        if (viteVal) return viteVal;
    }

    // 3. Vite client-side check
    try {
        return (import.meta as any).env[viteName];
    } catch (e) {
        // Fallback or move on
    }

    return undefined;
};
