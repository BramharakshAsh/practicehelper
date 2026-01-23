import { create } from 'zustand';
import { FinancialMetrics, TaskMetrics, StaffMetrics, reportsService } from '../services/reports.service';

interface ReportsState {
    financials: FinancialMetrics | null;
    tasks: TaskMetrics | null;
    staff: StaffMetrics[] | null;
    isLoading: boolean;
    hasFetched: boolean;
    error: string | null;

    // Actions
    fetchAllMetrics: (startDate?: Date, endDate?: Date) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
    financials: null,
    tasks: null,
    staff: null,
    isLoading: false,
    hasFetched: false,
    error: null,

    fetchAllMetrics: async (startDate, endDate) => {
        set({ isLoading: true, error: null });
        try {
            const [financials, tasks, staff] = await Promise.all([
                reportsService.getFinancialMetrics(startDate, endDate),
                reportsService.getTaskMetrics(startDate, endDate),
                reportsService.getStaffMetrics(startDate, endDate)
            ]);
            set({ financials, tasks, staff, isLoading: false, hasFetched: true });
        } catch (error: any) {
            set({ error: error.message, isLoading: false, hasFetched: true });
        }
    }
}));
