
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

async function testLogin() {
    try {
        const envPath = resolve('.env');
        const envContent = await readFile(envPath, 'utf8');
        const urlParams = envContent.match(/VITE_SUPABASE_URL="(.*)"/);
        const keyParams = envContent.match(/VITE_SUPABASE_ANON_KEY="(.*)"/);

        if (!urlParams || !keyParams) {
            console.error('Could not find Supabase URL/KEY in .env');
            return;
        }

        const supabaseUrl = urlParams[1];
        const supabaseKey = keyParams[1];

        console.log('Testing Login to:', supabaseUrl);

        const supabase = createClient(supabaseUrl, supabaseKey);

        const email = 'admin@democaassociates.com';
        const password = 'admin123';

        console.log('Attempting SignIn with:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login FAILED:', error);
            console.error('Error Status:', error.status);
        } else {
            console.log('Login SUCCESS. User ID:', data.user?.id);
            console.log('Session Token (first 20 chars):', data.session?.access_token?.substring(0, 20) + '...');
        }
    } catch (err) {
        console.error('Script Error:', err);
    }
}

testLogin();
