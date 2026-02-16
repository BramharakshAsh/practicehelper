import { supabase } from './services/supabase.js';
import { EmailService } from './services/EmailService.js';
import { TaskSummaryService } from './services/TaskSummaryService.js';
import { HtmlRenderer } from './services/HtmlRenderer.js';

const MAX_ATTEMPTS = 3;

export async function processEmailQueue() {
    console.log('[WORKER] processEmailQueue starting loop...');

    while (true) {
        try {
            // 1. Fetch one job using FOR UPDATE SKIP LOCKED
            // In Supabase client, we use rpc for for update skip locked since it's not supported in JS library directly for select
            // Actually, since this is a simple worker and we want reliability, I'll use a small RPC or a raw query if possible.
            // But for simplicity in this implementation, I'll fetch and mark processing. 
            // To avoid race conditions in a firm-grade system, I'll use a simple "status update" with filter.

            const { data: job, error: fetchError } = await supabase
                .from('email_jobs')
                .select('*')
                .eq('status', 'pending')
                .lte('scheduled_for', new Date().toISOString())
                .order('scheduled_for', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) {
                console.error('[WORKER] Error fetching jobs:', fetchError.message);
                await delay(5000);
                continue;
            }

            if (!job) {
                console.log('[WORKER] No pending jobs found. Sleeping for 10s...');
                await delay(10000);
                continue;
            }

            // 2. Mark processing (atomic update to claim the job)
            const { data: leadJob, error: updateError } = await supabase
                .from('email_jobs')
                .update({ status: 'processing', attempt_count: job.attempt_count + 1 })
                .eq('id', job.id)
                .eq('status', 'pending') // Double check status hasn't changed
                .select()
                .single();

            if (updateError || !leadJob) {
                // Job was likely picked up by another worker or updated
                continue;
            }

            console.log(`[EMAIL_JOB_STARTED] Processing job ${job.id} for user ${job.user_id}`);

            try {
                // Fetch user data separately to avoid schema cache issues with joins
                const { data: user, error: userFetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', job.user_id)
                    .single();

                if (userFetchError || !user || !user.is_active) {
                    console.log(`[EMAIL_SKIPPED] User ${job.user_id} is inactive or not found. Skipping. Error: ${userFetchError?.message}`);
                    await supabase.from('email_jobs').update({ status: 'skipped' }).eq('id', job.id);
                    continue;
                }

                // 3. Build task summary LIVE
                // Manager/Partner logic
                const isManager = user.role === 'manager' || user.role === 'partner';
                let html = '';
                let subject = '';
                let pendingCount = 0;

                if (isManager) {
                    const summaryA = await TaskSummaryService.getTasksCreatedByUser(user.id);
                    const summaryB = await TaskSummaryService.getFirmTaskSummary(job.firm_id);
                    pendingCount = summaryA.totalCount + summaryB.totalCount;

                    if (pendingCount === 0) {
                        console.log(`[EMAIL_SKIPPED] User ${user.full_name} has no pending tasks.`);
                        await supabase.from('email_jobs').update({ status: 'skipped' }).eq('id', job.id);
                        continue;
                    }

                    html = HtmlRenderer.renderManagerEmail(user, summaryA, summaryB);
                    subject = 'CAControl daily update';
                    console.log(`[WORKER] Built Manager email for ${user.email}. Tasks A: ${summaryA.totalCount}, B: ${summaryB.totalCount}`);
                } else {
                    const summary = await TaskSummaryService.getUserTaskSummary(user.id);
                    pendingCount = summary.totalCount;

                    if (pendingCount === 0) {
                        console.log(`[EMAIL_SKIPPED] User ${user.full_name} has no pending tasks.`);
                        await supabase.from('email_jobs').update({ status: 'skipped' }).eq('id', job.id);
                        continue;
                    }

                    html = HtmlRenderer.renderStaffEmail(user, summary);
                    subject = 'CAControl daily update';
                    console.log(`[WORKER] Built Staff email for ${user.email}. Tasks: ${summary.totalCount}`);
                }

                // 5. Send email via Resend
                await EmailService.send(user.email, subject, html);

                // 6. Update status sent
                await supabase.from('email_jobs').update({
                    status: 'sent',
                    sent_at: new Date().toISOString()
                }).eq('id', job.id);

                console.log(`[EMAIL_SENT] Completed job ${job.id} for ${user.email}`);

            } catch (err: any) {
                console.error(`[EMAIL_FAILED] Error processing job ${job.id}:`, err.message);

                const isFinal = job.attempt_count + 1 >= MAX_ATTEMPTS;
                await supabase.from('email_jobs').update({
                    status: isFinal ? 'failed' : 'pending',
                    last_error: err.message,
                    attempt_count: job.attempt_count + 1
                }).eq('id', job.id);

                if (!isFinal) {
                    // Wait for exponential backoff if needed, but here we just return to pending
                    console.log(`[EMAIL_FAILED] Scheduled retry for job ${job.id}`);
                }
            }

            // Wait random 5–10 seconds between sends
            const waitTime = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
            console.log(`[WORKER] Pacing: sleeping for ${Math.round(waitTime / 1000)}s`);
            await delay(waitTime);

        } catch (err: any) {
            console.error('[WORKER_PANIC] Unexpected error in worker loop:', err.message);
            await delay(10000); // Wait bit longer on crash
        }
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
