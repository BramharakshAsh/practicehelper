import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/cron-supabase';
import { Resend } from 'resend';

const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123456789';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const resend = new Resend(RESEND_API_KEY);

export async function GET(request: Request) {
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    if (!RESEND_API_KEY || RESEND_API_KEY === 're_123456789') {
        return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    try {
        console.log(`[EVENING_REMINDER] Starting execution at ${new Date().toISOString()}`);

        const now = new Date();
        const today6AM = new Date(now);
        today6AM.setHours(6, 0, 0, 0);

        // Fetch tasks that haven't been updated since 6 AM today and are not completed
        // We only care about users who currently have such tasks.
        const { data: pendingTasks, error: tasksError } = await supabaseAdmin
            .from('tasks')
            .select('id, staff_id, title, client:clients(name)')
            .neq('status', 'filed_completed')
            .not('staff_id', 'is', null)
            .or(`last_closure_at.is.null,last_closure_at.lt.${today6AM.toISOString()}`);

        if (tasksError) throw tasksError;

        if (!pendingTasks || pendingTasks.length === 0) {
            return NextResponse.json({ message: 'No staff members have pending updates.' });
        }

        // Group tasks by staff_id
        const staffTasks: Record<string, typeof pendingTasks> = {};
        for (const task of pendingTasks) {
            if (task.staff_id) {
                if (!staffTasks[task.staff_id]) staffTasks[task.staff_id] = [];
                staffTasks[task.staff_id].push(task);
            }
        }

        const staffIds = Object.keys(staffTasks);
        if (staffIds.length === 0) {
            return NextResponse.json({ message: 'No valid staff IDs found.' });
        }

        // Fetch staff profiles
        const { data: staffProfiles } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email')
            .in('id', staffIds)
            .eq('is_active', true);

        if (!staffProfiles || staffProfiles.length === 0) {
            return NextResponse.json({ message: 'No active staff found to email.' });
        }

        console.log(`[EVENING_REMINDER] Found ${staffProfiles.length} staff members needing reminders.`);

        const results = [];

        // Process sequentially to avoid Resend rate limits
        for (const staff of staffProfiles) {
            try {
                const tasks = staffTasks[staff.id] || [];
                if (tasks.length === 0) continue;

                // Build simple HTML
                let taskListHtml = '<ul style="padding-left: 20px;">';
                tasks.slice(0, 5).forEach(t => {
                    // @ts-ignore
                    const clientName = t.client?.name || 'Unknown Client';
                    taskListHtml += `<li style="margin-bottom: 8px;"><strong>${t.title}</strong> - ${clientName}</li>`;
                });
                if (tasks.length > 5) {
                    taskListHtml += `<li><em>...and ${tasks.length - 5} more active tasks.</em></li>`;
                }
                taskListHtml += '</ul>';

                const html = `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                        <h2 style="color: #ea580c;">Evening Work Closure Reminder</h2>
                        <p>Hi ${staff.full_name},</p>
                        <p>It's 6:00 PM. You have <strong>${tasks.length} active tasks</strong> that haven't been updated today. Please log in to CAControl to provide a quick status update (Progress, Blocked, or Waiting on Client) to complete your Daily Closure.</p>
                        ${taskListHtml}
                        <p style="margin-top: 24px;">
                            <a href="https://cacontrol.online/dashboard" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log in to CAControl</a>
                        </p>
                        <p style="font-size: 12px; color: #666; margin-top: 30px;">
                            This is an automated reminder. Please ensure all your work is accurately reflected in the system.
                        </p>
                    </div>
                `;

                await resend.emails.send({
                    from: 'CAControl <no-reply@cacontrol.online>',
                    to: staff.email,
                    subject: 'Action Required: Daily Work Closure',
                    html
                });

                results.push({ email: staff.email, status: 'sent', taskCount: tasks.length });
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay between emails
            } catch (err: any) {
                console.error(`Error emailing ${staff.email}:`, err);
                results.push({ email: staff.email, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, results });

    } catch (error: any) {
        console.error('[EVENING_REMINDER_CRITICAL]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
