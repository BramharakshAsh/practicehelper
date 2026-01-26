import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://djcaimdpcdxvwekixjco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqY2FpbWRwY2R4dndla2l4amNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTMyMTgsImV4cCI6MjA4MTg4OTIxOH0.1pWFxWcFk5UQ0VjOLceSH3u2AKeeF3V0mfKtzjt-AjE";

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking users table...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error connecting/querying users:', error.message);
    } else {
        // If table exists, data is null (head:true), count property contains the count
        // Wait, supabase-js v2 select count returns { count, data, error }
        // Actually error object contains details if table doesn't exist
        console.log('Users table query successful.');
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
        if (Array.isArray(loginData)) {
            const user = loginData[0];
            if (user && user.firm_id) {
                console.log('Firm ID detected:', user.firm_id);
            } else {
                console.log('Warning: No firm_id in user object (or user not found)');
            }
        } else {
            console.log('Data is not an array:', typeof loginData);
        }
    }
}

check();
