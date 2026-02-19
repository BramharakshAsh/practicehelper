import { supabase } from './services/supabase.js';
import { generateDayEndJobs } from './scheduler.js';
import { processEmailQueue } from './worker.js';
import { toZonedTime, format } from 'date-fns-tz';

/**
 * MANUAL TEST SCRIPT
 * This script bypasses the time window check to generate jobs
 * and then starts the worker to process them.
 */
async function runManualTest() {
    console.log('--- MANUAL TEST START ---');

    try {
        // 1. Fetch ALL active firms
        const { data: firms, error: firmError } = await supabase
            .from('firms')
            .select('*')
            .eq('is_active', true);

        if (firmError) {
            console.error('Error fetching firms:', firmError.message);
            return;
        }

        if (!firms || firms.length === 0) {
            console.error('No active firms found for testing.');
            return;
        }

        console.log(`Found ${firms.length} active firms. Processing...`);

        for (const firm of firms) {
            const timezone = firm.timezone || 'Asia/Kolkata';
            const now = new Date();
            const zonedDate = toZonedTime(now, timezone);
            const currentDayStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });

            console.log(`\nTesting for firm: ${firm.name} (${firm.id})`);

            // 2. Fetch users for this firm
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('firm_id', firm.id)
                .eq('is_active', true);

            if (userError) {
                console.error(`Error fetching users for firm ${firm.name}:`, userError.message);
                continue;
            }

            if (!users || users.length === 0) {
                console.log(`No active users found in ${firm.name}.`);
                continue;
            }

            console.log(`Found ${users.length} users. Creating test jobs...`);

            for (const user of users) {
                // Force job creation by ignoring the time window
                const { error: jobError } = await supabase
                    .from('email_jobs')
                    .upsert({
                        user_id: user.id,
                        firm_id: firm.id,
                        type: 'day_end_reminder',
                        scheduled_for: now.toISOString(),
                        scheduled_date: currentDayStr, // Unique constraint: (user_id, type, scheduled_date)
                        status: 'pending' // Force reset to pending for testing
                    }, {
                        onConflict: 'user_id,type,scheduled_date'
                    });

                if (jobError) {
                    console.error(`Failed to create test job for ${user.full_name}:`, jobError.message);
                } else {
                    console.log(`Check/Created test job for ${user.full_name} (${user.email})`);
                }
            }
        }

        console.log('\nJobs created. Now starting worker for one-off processing...');
        console.log('Keep this running to see logs. Press Ctrl+C to stop after you see completion.');

        // Start worker
        // processEmailQueue();
        console.log('Jobs created. Run "npx tsx scripts/test-cron.ts" to process them via API.');

    } catch (err: any) {
        console.error('Test script failed:', err.message);
    }
}

runManualTest();
