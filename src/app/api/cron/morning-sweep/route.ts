import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/cron-supabase';

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log(`[MORNING_SWEEP] Starting execution at ${new Date().toISOString()}`);

        const now = new Date();

        // Target 6 AM IST => 00:30 UTC
        const today6AM_IST = new Date(now);
        today6AM_IST.setUTCHours(0, 30, 0, 0);

        // If cron runs at e.g. 05:00 UTC, today6AM_IST is 00:30 UTC today.
        // If cron runs at e.g. 00:00 UTC, today6AM_IST is 00:30 UTC today (which is in the future).
        if (today6AM_IST > now) {
            today6AM_IST.setUTCDate(today6AM_IST.getUTCDate() - 1);
        }

        console.log(`[MORNING_SWEEP] Target 6 AM IST in UTC: ${today6AM_IST.toISOString()}`);

        // 1. Mark Unreported Tasks & Lockout Staff
        // Tasks that are NOT filed_completed, and either have no last_closure_at or last_closure_at < 6 AM IST today
        const { data: unreportedTasks, error: tasksError } = await supabaseAdmin
            .from('tasks')
            .select('id, staff_id')
            .neq('status', 'filed_completed')
            .or(`last_closure_at.is.null,last_closure_at.lt.${today6AM_IST.toISOString()}`);

        if (tasksError) {
            console.error('[MORNING_SWEEP] Error fetching tasks:', tasksError);
            throw tasksError;
        }

        const staffMissedSet = new Set<string>();

        if (unreportedTasks && unreportedTasks.length > 0) {
            console.log(`[MORNING_SWEEP] Marking ${unreportedTasks.length} tasks as unreported.`);

            // Mark tasks
            const taskIds = unreportedTasks.map(t => t.id);
            const { error: updateError } = await supabaseAdmin
                .from('tasks')
                .update({ is_unreported: true })
                .in('id', taskIds);

            if (updateError) {
                console.error('[MORNING_SWEEP] Error updating is_unreported flag:', updateError);
            } else {
                console.log(`[MORNING_SWEEP] Successfully marked ${taskIds.length} tasks as unreported.`);
            }

            // Collect staff who missed
            unreportedTasks.forEach((t) => {
                if (t.staff_id) staffMissedSet.add(t.staff_id);
            });
        }

        // 2. Process Staff Penalties
        // If they missed, increment unreported_days_count. If count >= 2, block login.
        if (staffMissedSet.size > 0) {
            const staffIds = Array.from(staffMissedSet);
            const { data: staffData } = await supabaseAdmin
                .from('users')
                .select('id, unreported_days_count')
                .in('id', staffIds);

            if (staffData) {
                for (const user of staffData) {
                    const newCount = (user.unreported_days_count || 0) + 1;
                    const block = newCount > 2;
                    await supabaseAdmin
                        .from('users')
                        .update({ unreported_days_count: newCount, login_blocked: block })
                        .eq('id', user.id);

                    // Mirror to staff table if needed
                    await supabaseAdmin
                        .from('staff')
                        .update({ unreported_days_count: newCount, login_blocked: block })
                        .eq('user_id', user.id);
                }
            }
        }

        // Reset unreported_days_count for staff who DID report today? 
        // This is complex, usually we just let the partner reset it. But week reset might be needed later.

        // 3. Calculate Firm Health Score
        console.log(`[MORNING_SWEEP] Calculating Firm Health Scores...`);
        const { data: firms } = await supabaseAdmin.from('firms').select('id').eq('is_active', true);

        if (firms) {
            for (const firm of firms) {
                try {
                    // Fetch all active tasks for the firm
                    const { data: allActiveTasks } = await supabaseAdmin
                        .from('tasks')
                        .select('id, staff_id, status, is_unreported, due_date, status_updated_at')
                        .eq('firm_id', firm.id)
                        .neq('status', 'filed_completed');

                    const activeTasks = allActiveTasks || [];
                    const totalActive = activeTasks.length;

                    if (totalActive === 0) continue; // Skip empty firms

                    // Pillar 1: Reporting Discipline (30 points)
                    const unreportedCount = activeTasks.filter(t => t.is_unreported).length;
                    const reportedCount = totalActive - unreportedCount;
                    const reportingScore = (reportedCount / totalActive) * 30;

                    // Pillar 2: Deadline Control (35 points)
                    const currentDate = new Date();
                    const overdueTasks = activeTasks.filter(t => new Date(t.due_date) < currentDate);
                    const overdueCount = overdueTasks.length;
                    const deadlineScore = Math.max(0, (1 - (overdueCount / totalActive)) * 35);

                    // Pillar 3: Dependency Aging (20 points)
                    // average days in "awaiting_client_data"
                    const waitingTasks = activeTasks.filter(t => t.status === 'awaiting_client_data');
                    let dependencyScore = 20;
                    if (waitingTasks.length > 0) {
                        let totalDaysWaiting = 0;
                        waitingTasks.forEach(t => {
                            if (t.status_updated_at) {
                                const diffTime = Math.abs(currentDate.getTime() - new Date(t.status_updated_at).getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                totalDaysWaiting += diffDays;
                            }
                        });
                        const avgWaiting = totalDaysWaiting / waitingTasks.length;
                        if (avgWaiting >= 6) dependencyScore = 5;
                        else if (avgWaiting >= 3) dependencyScore = 15;
                    }

                    // Pillar 4: Workload Stability (15 points) -> Fixed 15 for MVP unless obvious skew
                    const stabilityScore = 15;

                    const totalScore = reportingScore + deadlineScore + dependencyScore + stabilityScore;

                    // Identify biggest impact
                    let biggestImpact = '';
                    if (reportingScore < 20) biggestImpact = `${unreportedCount} tasks left unreported yesterday.`;
                    else if (deadlineScore < 25) biggestImpact = `${overdueCount} tasks are currently overdue.`;
                    else if (dependencyScore < 15) biggestImpact = 'High number of tasks stalled waiting on clients.';
                    else biggestImpact = 'Firm operations are controlled and healthy.';

                    // Insert to daily_firm_health
                    const todayStr = currentDate.toISOString().split('T')[0];
                    await supabaseAdmin.from('daily_firm_health').upsert({
                        firm_id: firm.id,
                        date: todayStr,
                        total_score: totalScore,
                        reporting_score: reportingScore,
                        deadline_score: deadlineScore,
                        dependency_score: dependencyScore,
                        stability_score: stabilityScore,
                        biggest_impact_factor: biggestImpact
                    }, { onConflict: 'firm_id, date' });

                    // 4. Calculate Staff Health Scores for this firm
                    const staffTasksMap = new Map<string, typeof activeTasks>();
                    activeTasks.forEach(t => {
                        if (t.staff_id) {
                            if (!staffTasksMap.has(t.staff_id)) staffTasksMap.set(t.staff_id, []);
                            staffTasksMap.get(t.staff_id)!.push(t);
                        }
                    });

                    for (const [staffId, staffTasks] of Array.from(staffTasksMap.entries())) {
                        try {
                            const staffTotalActive = staffTasks.length;
                            if (staffTotalActive === 0) continue;

                            // Pillar 1: Reporting Discipline
                            const staffUnreportedCount = staffTasks.filter(t => t.is_unreported).length;
                            const staffReportedCount = staffTotalActive - staffUnreportedCount;
                            const staffReportingScore = (staffReportedCount / staffTotalActive) * 30;

                            // Pillar 2: Deadline Control
                            const staffOverdueCount = staffTasks.filter(t => new Date(t.due_date) < currentDate).length;
                            const staffDeadlineScore = Math.max(0, (1 - (staffOverdueCount / staffTotalActive)) * 35);

                            // Pillar 3: Dependency Aging
                            const staffWaitingTasks = staffTasks.filter(t => t.status === 'awaiting_client_data');
                            let staffDependencyScore = 20;
                            if (staffWaitingTasks.length > 0) {
                                let staffTotalDaysWaiting = 0;
                                staffWaitingTasks.forEach(t => {
                                    if (t.status_updated_at) {
                                        const diffTime = Math.abs(currentDate.getTime() - new Date(t.status_updated_at).getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        staffTotalDaysWaiting += diffDays;
                                    }
                                });
                                const avgWaiting = staffTotalDaysWaiting / staffWaitingTasks.length;
                                if (avgWaiting >= 6) staffDependencyScore = 5;
                                else if (avgWaiting >= 3) staffDependencyScore = 15;
                            }

                            const staffStabilityScore = 15;
                            const staffTotalScore = staffReportingScore + staffDeadlineScore + staffDependencyScore + staffStabilityScore;

                            let staffBiggestImpact = '';
                            if (staffReportingScore < 20) staffBiggestImpact = `${staffUnreportedCount} tasks left unreported yesterday.`;
                            else if (staffDeadlineScore < 25) staffBiggestImpact = `${staffOverdueCount} tasks are currently overdue.`;
                            else if (staffDependencyScore < 15) staffBiggestImpact = 'High number of tasks stalled waiting on clients.';
                            else staffBiggestImpact = 'Your tasks are moving smoothly and on time.';

                            await supabaseAdmin.from('daily_staff_health').upsert({
                                firm_id: firm.id,
                                user_id: staffId,
                                date: todayStr,
                                total_score: staffTotalScore,
                                reporting_score: staffReportingScore,
                                deadline_score: staffDeadlineScore,
                                dependency_score: staffDependencyScore,
                                stability_score: staffStabilityScore,
                                biggest_impact_factor: staffBiggestImpact
                            }, { onConflict: 'user_id, date' });

                        } catch (staffErr) {
                            console.error(`[MORNING_SWEEP] Error calculating health for staff ${staffId}:`, staffErr);
                        }
                    }

                } catch (firmErr) {
                    console.error(`[MORNING_SWEEP] Error calculating health for firm ${firm.id}:`, firmErr);
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Morning sweep completed successfully.' });

    } catch (error: any) {
        console.error('[MORNING_SWEEP_CRITICAL]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
