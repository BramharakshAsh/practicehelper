# CAControl Backend - Day End Reminder System

Reliable, idempotent email notification system for daily task summaries.

## Tech Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Database**: Supabase (Postgres)
- **Email**: Resend API (Domain: cacontrol.online)
- **Scheduling**: `node-cron` with persistent `email_jobs` table

## Production Configuration
1. **Environment Variables**:
   Copy `.env.example` to `.env` and populate:
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: **CRITICAL**. Use the service role key to bypass RLS for task summaries.
   - `RESEND_API_KEY`: Your Resend API key.

2. **Database Setup**:
   Ensure the `email_jobs` table exists (created via SQL migrations provided during implementation).

3. **Running in Production**:
   We recommend using a process manager like **PM2** to ensure the service restarts on failure or system reboot.

   ```bash
   # Install dependencies
   npm install

   # Start with PM2 (standard)
   pm2 start npm --name "cacontrol-emails" -- run start

   # Or run directly
   npm run start
   ```

## Key Components
- `src/scheduler.ts`: Job generator. Checks timing (18:30-19:00 local) for each firm and creates persistent jobs.
- `src/worker.ts`: Job processor. Claims jobs atomically, builds HTML summaries, sends emails via Resend, and handles retries.
- `src/services/HtmlRenderer.ts`: Responsive email templates.
- `src/services/TaskSummaryService.ts`: Core logic for task classification.

## Monitoring
- Check the `email_jobs` table in Supabase for delivery status.
- Primary logs: `[EMAIL_JOB_STARTED]`, `[EMAIL_SENT]`, `[EMAIL_FAILED]`.
- Failure recovery: Standard Resend error handling implemented.
