import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env manually since this script isn't running through Vite
import fs from 'fs';
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking users table...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error connecting/querying users:', error.message);
    } else {
        console.log('Users table exists. Count:', data); // data is null for head:true with count, use count property
    }

    // Also try login RPC
    console.log('Testing login RPC...');
    const { data: loginData, error: loginError } = await supabase.rpc('login', {
        _username: 'admin',
        _password: 'admin123',
        _role: 'partner'
    });

    if (loginError) {
        console.error('Login RPC error:', loginError.message);
    } else {
        console.log('Login RPC success. Data returned:', JSON.stringify(loginData, null, 2));
        const user = loginData[0];
        if (user && user.firm_id) {
            console.log('Firm ID detected:', user.firm_id);
        } else {
            console.log('Warning: No firm_id in user object');
        }
    }
}

check();
