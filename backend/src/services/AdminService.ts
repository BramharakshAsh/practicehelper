import { supabase } from './supabase.js';

export class AdminService {
    /**
     * Gets email job status for a firm on a specific date
     * @param firmId UUID of the firm
     * @param date Date in YYYY-MM-DD format
     */
    static async getEmailStatus(firmId: string, date: string) {
        const { data, error } = await supabase
            .from('email_jobs')
            .select('*')
            .eq('firm_id', firmId)
            .eq('scheduled_date', date);

        if (error) {
            console.error(`[ADMIN_QUERY_FAILED] Failed to get email status for firm ${firmId} on ${date}:`, error.message);
            throw error;
        }

        return data;
    }
}
