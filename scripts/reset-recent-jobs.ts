import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetJobs() {
    console.log('Resetting recent jobs to PENDING...');

    // Reset jobs created in the last 6 hours (covers the recent manual test)
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data, error, count } = await supabase
        .from('email_jobs')
        .update({
            status: 'pending',
            attempt_count: 0,
            last_error: null,
            sent_at: null
        })
        .gt('created_at', cutoff)
        .select('id, user_id, status');

    if (error) {
        console.error('Error resetting jobs:', error);
    } else {
        console.log(`✅ Successfully reset ${data?.length} jobs to pending.`);
    }
}

resetJobs();
