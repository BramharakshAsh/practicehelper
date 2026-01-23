import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "npm:nodemailer@6.9.16";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')

serve(async (req) => {
    try {
        console.log('[ScheduledEmails] Starting scheduled email check via Gmail SMTP...')

        if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
            throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const today = new Date()
        const currentDay = today.getDate()

        console.log(`[ScheduledEmails] Current day: ${currentDay}`)

        // Find all active schedules for today
        const { data: schedules, error: schedulesError } = await supabase
            .from('client_email_schedules')
            .select(`
        *,
        client:clients(id, name, email, contact_person),
        template:email_templates(id, name, subject, body)
      `)
            .eq('is_active', true)
            .eq('schedule_day', currentDay)

        if (schedulesError) {
            console.error('[ScheduledEmails] Error fetching schedules:', schedulesError)
            throw schedulesError
        }

        console.log(`[ScheduledEmails] Found ${schedules?.length || 0} active schedules for day ${currentDay}`)

        // Create Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD,
            },
        });

        let emailsSent = 0
        let errors = []

        for (const schedule of schedules || []) {
            try {
                // Check if we already sent for this period
                const shouldSend = !schedule.last_sent_at ||
                    isNewPeriod(schedule.last_sent_at, schedule.frequency)

                if (!shouldSend) {
                    console.log(`[ScheduledEmails] Skipping schedule ${schedule.id} - already sent for this period`)
                    continue
                }

                const mailOptions = {
                    from: `"Firm Flow" <${GMAIL_USER}>`,
                    to: schedule.client.email,
                    subject: schedule.template.subject,
                    html: renderEmailBody(schedule.template.body, schedule.client),
                };

                // Send email via Nodemailer
                const info = await transporter.sendMail(mailOptions);
                console.log(`[ScheduledEmails] Email sent successfully:`, info.messageId)

                // Update last_sent_at
                await supabase
                    .from('client_email_schedules')
                    .update({ last_sent_at: new Date().toISOString() })
                    .eq('id', schedule.id)

                emailsSent++

            } catch (scheduleError) {
                console.error(`[ScheduledEmails] Error processing schedule ${schedule.id}:`, scheduleError)
                errors.push({ scheduleId: schedule.id, error: scheduleError.message || scheduleError.toString() })
            }
        }

        transporter.close();

        const result = {
            success: true,
            emailsSent,
            schedulesProcessed: schedules?.length || 0,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        }

        console.log('[ScheduledEmails] Completed:', result)

        return new Response(
            JSON.stringify(result),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[ScheduledEmails] Fatal error:', error)
        return new Response(
            JSON.stringify({ error: error.message || error.toString() }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

function isNewPeriod(lastSent: string, frequency: string): boolean {
    const last = new Date(lastSent)
    const now = new Date()

    switch (frequency) {
        case 'monthly':
            return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear()
        case 'quarterly':
            return Math.floor(last.getMonth() / 3) !== Math.floor(now.getMonth() / 3) ||
                last.getFullYear() !== now.getFullYear()
        case 'yearly':
            return last.getFullYear() !== now.getFullYear()
        default:
            return true
    }
}

function renderEmailBody(template: string, client: any): string {
    // Simple template variable replacement
    return template
        .replace(/\{\{client_name\}\}/g, client.name || 'Client')
        .replace(/\{\{contact_person\}\}/g, client.contact_person || '')
        .replace(/\{\{email\}\}/g, client.email || '')
}
