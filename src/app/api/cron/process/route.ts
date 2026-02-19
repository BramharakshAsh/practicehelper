import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/cron-supabase';
import { Resend } from 'resend';
import { TaskSummaryService } from '../../../../services/cron-task-service';
import { HtmlRenderer } from '../../../../services/cron-html-renderer';

const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
}

const resend = new Resend(RESEND_API_KEY);
const BATCH_SIZE = 5; // Process 5 emails per run (runs every minute)

export async function GET(request: Request) {
    // Security check
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // 1. Fetch pending jobs (Priority: Newest First)
        const { data: jobs, error: fetchError } = await supabaseAdmin
            .from('email_jobs')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_for', new Date().toISOString())
            .order('scheduled_for', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(BATCH_SIZE);

        if (fetchError) throw fetchError;

        if (!jobs || jobs.length === 0) {
            return NextResponse.json({ message: 'No pending jobs' });
        }

        const results = [];

        // 2. Process Batch
        for (const job of jobs) {
            try {
                // Claim job
                const { error: claimError } = await supabaseAdmin
                    .from('email_jobs')
                    .update({ status: 'processing', attempt_count: job.attempt_count + 1 })
                    .eq('id', job.id)
                    .eq('status', 'pending'); // Optimistic lock

                if (claimError) continue; // Skip if already claimed

                // Fetch User
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('id', job.user_id)
                    .single();

                if (!user || !user.is_active) {
                    await supabaseAdmin.from('email_jobs').update({ status: 'skipped' }).eq('id', job.id);
                    results.push({ id: job.id, status: 'skipped_inactive_user' });
                    continue;
                }

                // Generate Email Content
                let html = '';
                let subject = 'CAControl daily update';
                let pendingCount = 0;

                // --- SERVICE LOGIC PORT NEEDED HERE ---
                // For now, assume services are ported to src/services/cron-...
                const isManager = user.role === 'manager' || user.role === 'partner';

                if (isManager) {
                    const summaryA = await TaskSummaryService.getTasksCreatedByUser(user.id);
                    const summaryB = await TaskSummaryService.getFirmTaskSummary(job.firm_id);
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
                    await supabaseAdmin.from('email_jobs').update({ status: 'skipped' }).eq('id', job.id);
                    results.push({ id: job.id, status: 'skipped_no_tasks' });
                    continue;
                }

                // Send Email
                const { error: emailError } = await resend.emails.send({
                    from: 'CAControl <no-reply@cacontrol.online>',
                    to: user.email,
                    subject,
                    html
                });

                if (emailError) throw new Error(emailError.message);

                // Mark Sent
                await supabaseAdmin.from('email_jobs').update({
                    status: 'sent',
                    sent_at: new Date().toISOString()
                }).eq('id', job.id);

                results.push({ id: job.id, status: 'sent', email: user.email });

            } catch (err: any) {
                console.error(`Job ${job.id} failed:`, err);
                const isFinal = job.attempt_count + 1 >= 3;
                await supabaseAdmin.from('email_jobs').update({
                    status: isFinal ? 'failed' : 'pending',
                    last_error: err.message
                }).eq('id', job.id);
                results.push({ id: job.id, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, results });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
