import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
    );
}

// Check if debug mode is enabled (via localStorage or env)
const isDebug = import.meta.env.DEV || localStorage.getItem('debug') === 'true';

if (isDebug) {
    console.log('[Supabase] Initializing client for:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true, // Re-enabled persistence as it's typically needed for real apps unless strictly specified
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    // Adding global logging for Supabase queries if debug is enabled
    db: {
        schema: 'public'
    }
});

// Add a global helper for developers to toggle logs
if (typeof window !== 'undefined') {
    (window as any).enableLogs = () => {
        localStorage.setItem('debug', 'true');
        console.log('Developer logs enabled. Please refresh the page.');
    };
    (window as any).disableLogs = () => {
        localStorage.removeItem('debug');
        console.log('Developer logs disabled. Please refresh the page.');
    };
}