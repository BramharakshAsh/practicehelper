import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserEmail(email: string) {
    console.log(`Checking email status for: ${email}`);

    // 1. Get User ID
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, firm_id, role, is_active')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error('User not found:', userError?.message);
        return;
    }

    console.log(`User Found: ID=${user.id}, Role=${user.role}, Active=${user.is_active}, Firm=${user.firm_id}`);

    // 2. Get Latest Job
    const { data: job, error: jobError } = await supabase
        .from('email_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (jobError) {
        console.error('Error fetching job:', jobError.message);
        return;
    }

    if (!job) {
        console.log('No email jobs found for this user.');
        return;
    }

    console.log('Latest Job Details:');
    console.log(`- ID: ${job.id}`);
    console.log(`- Status: ${job.status}`);
    console.log(`- Scheduled For: ${job.scheduled_for}`);
    console.log(`- Sent At: ${job.sent_at}`);
    console.log(`- Created At: ${job.created_at}`);
    console.log(`- Last Error: ${job.last_error}`);
}

const email = process.argv[2] || 'aman@sbhco.com';
checkUserEmail(email);
