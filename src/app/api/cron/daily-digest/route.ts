import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/cron-supabase';
import { Resend } from 'resend';
import { TaskSummaryService } from '../../../../services/cron-task-service';
import { HtmlRenderer } from '../../../../services/cron-html-renderer';

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
    firm_id: string;
    is_active: boolean;
}

// Security: Verify CRON_SECRET if present in env
// Security: Verify CRON_SECRET if present in env
const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123456789'; // Fallback to prevent build error

// Vercel Serverless Function Timeout is typically 10s on Hobby, 60s on Pro.
// We must be efficient.
export const maxDuration = 60; // Attempt to set max duration (if Pro, ignores on Hobby but good intent)
export const dynamic = 'force-dynamic';

const resend = new Resend(RESEND_API_KEY);

export async function GET(request: Request) {
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    if (!RESEND_API_KEY) {
        return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    try {
        console.log(`[DAILY_DIGEST] Starting execution at ${new Date().toISOString()}`);

        // 1. Fetch all active users directly (No per-firm time check, we run at a global time)
        // Optimization: Fetch only necessary fields
        const { data: users, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email, role, firm_id, is_active')
            .eq('is_active', true);

        if (userError) throw userError;

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No active users found' });
        }

        console.log(`[DAILY_DIGEST] Found ${users.length} users. Processing parallel batches...`);

        const results = [];
        const BATCH_SIZE = 1; // Sequential processing to respect Resend 2 req/sec limit

        // Process users in batches
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (user: User) => {
                try {
                    // Small delay to be safe
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // A. Check for pending tasks
                    let html = '';
                    const isManager = user.role === 'manager' || user.role === 'partner';
                    let pendingCount = 0;

                    if (isManager) {
                        const summaryA = await TaskSummaryService.getTasksCreatedByUser(user.id);
                        const summaryB = await TaskSummaryService.getFirmTaskSummary(user.firm_id);
                        pendingCount = summaryA.totalCount + summaryB.totalCount;
                        if (pendingCount > 0) {
                            html = HtmlRenderer.renderManagerEmail(user, summaryA, summaryB);
                        }
                    } else {
                        const summary = await TaskSummaryService.getUserTaskSummary(user.id);
                        pendingCount = summary.totalCount;
                        if (pendingCount > 0) {
                            html = HtmlRenderer.renderStaffEmail(user, summary);
                        }
                    }

                    if (pendingCount === 0) {
                        return { email: user.email, status: 'skipped_no_tasks' };
                    }

                    // B. Send Email
                    const { error: emailError } = await resend.emails.send({
                        from: 'CAControl <no-reply@cacontrol.online>',
                        to: user.email,
                        subject: 'CAControl Daily Update',
                        html
                    });

                    if (emailError) throw emailError;

                    // C. Log Job (Optional but good for history)
                    await supabaseAdmin.from('email_jobs').insert({
                        user_id: user.id,
                        firm_id: user.firm_id,
                        type: 'day_end_reminder_digest',
                        scheduled_for: new Date().toISOString(),
                        scheduled_date: new Date().toISOString().split('T')[0],
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    });

                    return { email: user.email, status: 'sent' };

                } catch (err: any) {
                    console.error(`Error processing ${user.email}:`, err);
                    return { email: user.email, status: 'failed', error: err.message };
                }
            });

            // Wait for this batch to finish before starting the next
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });

    } catch (error: any) {
        console.error('[DAILY_DIGEST_CRITICAL]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
