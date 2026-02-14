import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
    /**
     * Sends an email via Resend
     * @param to Recipient email address
     * @param subject Email subject
     * @param html HTML content of the email
     */
    static async send(to: string, subject: string, html: string): Promise<{ id: string }> {
        console.log(`[EMAIL_JOB_STARTED] Sending email to ${to} with subject: ${subject}`);

        try {
            const { data, error } = await resend.emails.send({
                from: 'CAControl <no-reply@cacontrol.online>', // Updated domain
                to,
                subject,
                html,
            });

            if (error) {
                console.error(`[EMAIL_FAILED] Failed to send email to ${to}:`, error);
                throw error;
            }

            console.log(`[EMAIL_SENT] Successfully sent email to ${to}. ID: ${data?.id}`);
            return { id: data?.id || '' };
        } catch (err: any) {
            console.error(`[EMAIL_FAILED] Unexpected error sending email to ${to}:`, err.message);
            throw err;
        }
    }
}
