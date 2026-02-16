import cron from 'node-cron';
import { supabase } from './services/supabase.js';
import { toZonedTime, format } from 'date-fns-tz';

export async function generateDayEndJobs() {
    console.log(`[JOB_CREATOR] Starting generateDayEndJobs at ${new Date().toISOString()}`);

    try {
        // 1. Fetch all active firms
        const { data: firms, error: firmError } = await supabase
            .from('firms')
            .select('*')
            .eq('is_active', true);

        if (firmError) throw firmError;

        for (const firm of firms) {
            const timezone = firm.timezone || 'Asia/Kolkata';
            const now = new Date();
            const zonedDate = toZonedTime(now, timezone);
            const currentTimeStr = format(zonedDate, 'HH:mm', { timeZone: timezone });
            const currentDayStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });

            console.log(`[JOB_CREATOR] Firm ${firm.name} (${firm.id}) local time: ${currentTimeStr} (${timezone})`);

            // 2. Check if local time is between 18:30 and 19:00
            if (currentTimeStr >= '18:30' && currentTimeStr <= '19:00') {
                console.log(`[JOB_CREATOR] Firm ${firm.name} is within window. Creating jobs...`);

                // 3. Fetch all active users for this firm
                const { data: users, error: userError } = await supabase
                    .from('users')
                    .select('id, full_name, email')
                    .eq('firm_id', firm.id)
                    .eq('is_active', true);

                if (userError) {
                    console.error(`[JOB_CREATOR] Failed to fetch users for firm ${firm.id}:`, userError);
                    continue;
                }

                for (const user of users) {
                    // 4. Create job for each user (On Conflict Do Nothing via DB constraint)
                    const { error: jobError } = await supabase
                        .from('email_jobs')
                        .upsert({
                            user_id: user.id,
                            firm_id: firm.id,
                            type: 'day_end_reminder',
                            scheduled_for: now.toISOString(),
                            scheduled_date: currentDayStr,
                            status: 'pending'
                        }, {
                            onConflict: 'user_id,type,scheduled_date',
                            ignoreDuplicates: true
                        });

                    if (jobError) {
                        // Log error but continue with other users
                        console.error(`[JOB_CREATOR] Failed to create job for user ${user.id}:`, jobError.message);
                    } else {
                        console.log(`[EMAIL_JOB_CREATED] Created/Checked job for user ${user.id} (${firm.name})`);
                    }
                }
            } else {
                console.log(`[JOB_CREATOR] Firm ${firm.name} outside window (18:30-19:00). Skipping.`);
            }
        }
    } catch (err: any) {
        console.error(`[JOB_GENTOR_FAILED] Error in generateDayEndJobs:`, err.message);
    }
}

// Run every 15 minutes
export function startScheduler() {
    cron.schedule('*/15 * * * *', () => {
        generateDayEndJobs();
    });
    console.log('[SCHEDULER] generateDayEndJobs scheduled to run every 15 minutes.');
}
