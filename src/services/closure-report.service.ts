import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

export interface TaskClosure {
    id: string;
    created_at: string;
    task_id: string;
    staff_id: string;
    firm_id: string;
    action_type: 'no_change' | 'blocked' | 'waiting_client' | 'progress';
    remarks: string | null;
    old_status: string | null;
    new_status: string | null;
    old_completion_percentage: number | null;
    new_completion_percentage: number | null;
    task?: {
        title: string;
        client?: {
            name: string;
        }
    };
}

export interface DailyClosureReportDay {
    dateStr: string; // YYYY-MM-DD
    staffReports: Record<string, StaffClosureSummary>;
}

export interface StaffClosureSummary {
    staff_id: string;
    staff_name: string;
    role: string;
    isReported: boolean;
    closures: TaskClosure[];
}

class ClosureReportService {
    async getClosureReports(daysToFetch: number = 7): Promise<DailyClosureReportDay[]> {
        const user = useAuthStore.getState().user;
        if (!user || (user.role !== 'partner' && user.role !== 'manager')) {
            throw new Error('Unauthorized');
        }

        const firmId = user.firm_id;

        // 1. Fetch active staff
        const { data: staffData, error: staffError } = await supabase
            .from('users')
            .select('id, full_name, role')
            .eq('firm_id', firmId)
            .in('role', ['staff', 'paid_staff', 'manager', 'partner'])
            .eq('is_active', true);

        if (staffError) throw staffError;

        // 2. Determine date range
        const now = new Date();
        const dateRangeStart = new Date(now);
        dateRangeStart.setDate(now.getDate() - daysToFetch);
        dateRangeStart.setHours(0, 0, 0, 0);

        // 3. Fetch closures
        const { data: closuresData, error: closuresError } = await supabase
            .from('task_closures')
            .select(`
                *,
                task:tasks (
                    title,
                    client:clients(name)
                )
            `)
            .eq('firm_id', firmId)
            .gte('created_at', dateRangeStart.toISOString())
            .order('created_at', { ascending: false });

        if (closuresError) throw closuresError;

        // 4. Process data into days
        const reportDaysMap: Record<string, DailyClosureReportDay> = {};

        // Generate the last X days
        for (let i = 0; i <= daysToFetch; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD

            reportDaysMap[dateStr] = {
                dateStr,
                staffReports: {}
            };

            // Initialize staff for this day
            staffData.forEach(staff => {
                reportDaysMap[dateStr].staffReports[staff.id] = {
                    staff_id: staff.id,
                    staff_name: staff.full_name || 'Unknown',
                    role: staff.role,
                    isReported: false,
                    closures: []
                };
            });
        }

        // Map closures to days
        (closuresData as TaskClosure[] || []).forEach(closure => {
            const closureDate = new Date(closure.created_at);

            // If closed before 6 AM, it counts for yesterday
            if (closureDate.getHours() < 6) {
                closureDate.setDate(closureDate.getDate() - 1);
            }

            const dateStr = closureDate.toLocaleDateString('en-CA');

            if (reportDaysMap[dateStr] && reportDaysMap[dateStr].staffReports[closure.staff_id]) {
                const staffReport = reportDaysMap[dateStr].staffReports[closure.staff_id];
                staffReport.isReported = true;
                staffReport.closures.push(closure);
            }
        });

        // Convert to array and sort by date descending
        const sortedDays = Object.values(reportDaysMap).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

        return sortedDays;
    }
}

export const closureReportService = new ClosureReportService();
