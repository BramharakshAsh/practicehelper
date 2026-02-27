import { Task } from '../types';
import { DailyFirmHealth } from '../types';

/**
 * Calculates a live health score based on an array of active tasks.
 * Applies the 4-pillar calculation algorithm:
 * 1. Reporting Discipline (30pts)
 * 2. Deadline Control (35pts)
 * 3. Client Dependency Aging (20pts)
 * 4. Workload Stability (15pts)
 * 
 * @param activeTasks An array of active (not filed_completed) tasks.
 * @returns An object conforming to DailyFirmHealth containing the calculated scores.
 */
export const calculateLiveHealthScore = (activeTasks: Task[]): Omit<DailyFirmHealth, 'id' | 'firm_id' | 'date' | 'created_at'> => {
    const totalActive = activeTasks.length;

    if (totalActive === 0) {
        return {
            total_score: 100,
            reporting_score: 30,
            deadline_score: 35,
            dependency_score: 20,
            stability_score: 15,
            biggest_impact_factor: 'No active tasks. Firm operations are at zero load.',
        };
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Pillar 1: Reporting Discipline (30 points)
    const unreportedCount = activeTasks.filter(t => t.is_unreported).length;
    const reportedCount = totalActive - unreportedCount;
    // Calculate ratio of reported to total active, max 30 points
    const reportingScore = (reportedCount / totalActive) * 30;

    // Pillar 2: Deadline Control (35 points)
    const overdueTasks = activeTasks.filter(t => {
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() < currentDate.getTime();
    });
    const overdueCount = overdueTasks.length;
    // Penalty scales linearly with overdue ratio
    const deadlineScore = Math.max(0, (1 - (overdueCount / totalActive)) * 35);

    // Pillar 3: Dependency Aging (20 points)
    const waitingTasks = activeTasks.filter(t => t.status === 'awaiting_client_data');
    let dependencyScore = 20;

    if (waitingTasks.length > 0) {
        let totalDaysWaiting = 0;
        waitingTasks.forEach(t => {
            if (t.status_updated_at) {
                const statusDate = new Date(t.status_updated_at);
                statusDate.setHours(0, 0, 0, 0);
                const diffTime = Math.abs(currentDate.getTime() - statusDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalDaysWaiting += diffDays;
            }
        });
        const avgWaiting = totalDaysWaiting / waitingTasks.length;
        if (avgWaiting >= 6) {
            dependencyScore = 5;
        } else if (avgWaiting >= 3) {
            dependencyScore = 15;
        }
    }

    // Pillar 4: Workload Stability (15 points)
    // For MVP, static 15 points unless obvious skew
    const stabilityScore = 15;

    const totalScore = reportingScore + deadlineScore + dependencyScore + stabilityScore;

    // Identify biggest impact factor
    let biggestImpact = '';
    if (reportingScore < 20) {
        biggestImpact = `${unreportedCount} task${unreportedCount !== 1 ? 's' : ''} left unreported yesterday.`;
    } else if (deadlineScore < 25) {
        biggestImpact = `${overdueCount} task${overdueCount !== 1 ? 's' : ''} ${overdueCount === 1 ? 'is' : 'are'} currently overdue.`;
    } else if (dependencyScore < 15) {
        biggestImpact = 'High number of tasks stalled waiting on clients.';
    } else {
        biggestImpact = 'Firm operations are controlled and healthy.';
    }

    return {
        total_score: totalScore,
        reporting_score: reportingScore,
        deadline_score: deadlineScore,
        dependency_score: dependencyScore,
        stability_score: stabilityScore,
        biggest_impact_factor: biggestImpact
    };
};
