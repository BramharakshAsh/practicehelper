-- Create RPC function to atomically claim next email job
CREATE OR REPLACE FUNCTION claim_next_email_job() RETURNS json LANGUAGE plpgsql AS $$
DECLARE job_record json;
BEGIN WITH next_job AS (
    SELECT id
    FROM email_jobs
    WHERE status = 'pending'
        AND scheduled_for <= now()
    ORDER BY scheduled_for ASC,
        created_at ASC
    LIMIT 1 FOR
    UPDATE SKIP LOCKED
)
UPDATE email_jobs
SET status = 'processing',
    attempt_count = attempt_count + 1,
    updated_at = now()
FROM next_job
WHERE email_jobs.id = next_job.id
RETURNING row_to_json(email_jobs.*) INTO job_record;
RETURN job_record;
END;
$$;
-- Create missing indexes for performance
-- Using simple CREATE INDEX instead of CONCURRENTLY to avoid transaction block errors in migration flows
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_firm ON public.meetings(client_id, firm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_compliance_type ON public.tasks(compliance_type_id);