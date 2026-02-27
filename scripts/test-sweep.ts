import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const now = new Date();
    const today6AM = new Date(now);
    today6AM.setHours(6, 0, 0, 0);

    console.log('Local now:', now.toString());
    console.log('UTC now:', now.toISOString());
    console.log('Local today6AM:', today6AM.toString());
    console.log('UTC today6AM:', today6AM.toISOString());

    const { data: unreportedTasks, error } = await supabaseAdmin
        .from('tasks')
        .select('id, title, staff_id, last_closure_at, is_unreported, status')
        .neq('status', 'filed_completed')
        .or(`last_closure_at.is.null,last_closure_at.lt.${today6AM.toISOString()}`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\nTasks that would be marked unreported (${unreportedTasks?.length || 0}):`);
    unreportedTasks?.forEach(t => {
        console.log(`- [${t.id}] ${t.title} | last_closure_at: ${t.last_closure_at} | is_unreported: ${t.is_unreported}`);
    });
}

run();
