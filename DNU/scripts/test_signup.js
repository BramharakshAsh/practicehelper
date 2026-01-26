
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

async function testSignup() {
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

        console.log('Testing connection to:', supabaseUrl);

        const supabase = createClient(supabaseUrl, supabaseKey);

        const email = `test_signup_${Date.now()}@example.com`;
        const password = 'testpassword123';

        console.log('Attempting SignUp with:', email);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('SignUp FAILED:', error);
            console.error('Error Status:', error.status);
        } else {
            console.log('SignUp SUCCESS. User ID:', data.user?.id);
        }
    } catch (err) {
        console.error('Script Error:', err);
    }
}

testSignup();
