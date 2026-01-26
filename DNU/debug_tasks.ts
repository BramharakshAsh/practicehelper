
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ekartahcscinebxabmws.supabase.co";
const supabaseKey = "sb_publishable_jQcD7F3ncTmcn0oxWnhifw_LKmtWmYg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('Fetching all raw tasks without foreign keys...');
    const { data: tasks, error } = await supabase.from('tasks').select('*');
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log(`Found ${tasks.length} tasks.`);
        tasks.forEach(t => console.log(`- ${t.title} | ID: ${t.id} | FirmID: ${t.firm_id} | CompTypeID: ${t.compliance_type_id}`));
    }

    console.log('\nFetching all compliance types...');
    const { data: ctypes, error: cError } = await supabase.from('compliance_types').select('*');
    if (cError) {
        console.log('Error:', cError.message);
    } else {
        console.log(`Found ${ctypes.length} compliance types.`);
        ctypes.forEach(c => console.log(`- ${c.name} | ID: ${c.id}`));
    }
}

debug();
