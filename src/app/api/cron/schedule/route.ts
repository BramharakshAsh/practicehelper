import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/cron-supabase';
import { toZonedTime, format } from 'date-fns-tz';

// Security: Verify CRON_SECRET if present in env
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log(`[CRON_SCHEDULER] Starting job generation at ${new Date().toISOString()}`);

        // 1. Fetch all active firms
        const { data: firms, error: firmError } = await supabaseAdmin
            .from('firms')
            .select('*')
            .eq('is_active', true);

        if (firmError) throw firmError;

        let jobsCreated = 0;
        const logs: string[] = [];

        for (const firm of firms) {
            const timezone = firm.timezone || 'Asia/Kolkata';
            const now = new Date();
            const zonedDate = toZonedTime(now, timezone);
            const currentTimeStr = format(zonedDate, 'HH:mm', { timeZone: timezone });
            const currentDayStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });

            logs.push(`Firm ${firm.name}: Local time ${currentTimeStr}`);

            // 2. Check time window (18:30 - 19:30 to be safe, runs every 15 mins)
            // Expanded window slightly to ensure we don't miss it if a cron is delayed
            if (currentTimeStr >= '18:30' && currentTimeStr <= '19:30') {

                // 3. Fetch active users
                const { data: users, error: userError } = await supabaseAdmin
                    .from('users')
                    .select('id, full_name, email')
                    .eq('firm_id', firm.id)
                    .eq('is_active', true);

                if (userError) {
                    console.error(`Failed users fetch for ${firm.name}:`, userError);
                    continue;
                }

                if (!users) continue;

                for (const user of users) {
                    // 4. Create idempotent job
                    const { error: jobError, status } = await supabaseAdmin
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

                    if (!jobError && status === 201) {
                        // 201 means created, 200/204 means existed/ignored
                        jobsCreated++;
                        logs.push(`Created job for ${user.email}`);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            jobsCreated,
            logs
        });

    } catch (error: any) {
        console.error('[CRON_SCHEDULER_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
