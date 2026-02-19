import { createClient } from '@supabase/supabase-js';
// import { Database } from '../types/supabase';

// Use standard environment variables for Vercel
// Fallback to placeholder to prevent build errors (Next.js build checks this file)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Missing Supabase environment variables for Cron Jobs. Using placeholders for build.');
}

// Create a new client with the service role key for admin access
export const supabaseAdmin = createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
