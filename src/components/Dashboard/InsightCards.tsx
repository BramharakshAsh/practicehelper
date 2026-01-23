import React, { useMemo } from 'react';
import { Calendar, AlertCircle, Clock, CheckSquare, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Task, ComplianceType } from '../../types';

interface InsightCardsProps {
    tasks: Task[];
    complianceTypes: ComplianceType[];
}

const InsightCards: React.FC<InsightCardsProps> = ({ tasks, complianceTypes }) => {
    const navigate = useNavigate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // --- Calculations - All Memoized ---
    const insights = useMemo(() => {
        const getDateOnly = (dateStr: string) => {
            const d = new Date(dateStr);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };

        const getComplianceCategory = (taskId: string) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return 'Other';
            const type = complianceTypes.find(ct => ct.id === task.compliance_type_id);
            return type?.category || 'Other';
        };

        // 1. Due Today
        const dueTodayTasks = tasks.filter(t => {
            if (t.status === 'filed_completed') return false;
            const d = getDateOnly(t.due_date);
            return d.getTime() === today.getTime();
        });

        const dueTodayBreakdown = dueTodayTasks.reduce((acc, t) => {
            const cat = getComplianceCategory(t.id);
            const shortCat = cat === 'Income Tax' ? 'IT' : cat;
            acc[shortCat] = (acc[shortCat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 2. Overdue
        const overdueTasks = tasks.filter(t => {
            if (t.status === 'filed_completed') return false;
            const d = getDateOnly(t.due_date);
            return d.getTime() < today.getTime();
        });

        let oldestOverdueDays = 0;
        if (overdueTasks.length > 0) {
            const oldestDate = overdueTasks.reduce((oldest, t) => {
                const d = new Date(t.due_date);
                return d < oldest ? d : oldest;
            }, new Date());
            const diffTime = Math.abs(today.getTime() - getDateOnly(oldestDate.toISOString()).getTime());
            oldestOverdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // 3. Awaiting Client Data
        const awaitingClientTasks = tasks.filter(t => t.status === 'awaiting_client_data');

        // 4. Pending Partner Review
        const pendingReviewTasks = tasks.filter(t => t.status === 'ready_for_review');

        // 5. Staff Overloaded (> 5 active tasks)
        const activeTasksByStaff = tasks.reduce((acc, t) => {
            if (t.status !== 'filed_completed' && t.staff_id) {
                acc[t.staff_id] = (acc[t.staff_id] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const overloadedStaffCount = Object.values(activeTasksByStaff).filter(count => count > 5).length;

        // 6. Upcoming (Next 7 Days)
        const upcomingTasks = tasks.filter(t => {
            if (t.status === 'filed_completed') return false;
            const d = getDateOnly(t.due_date);
            const diffTime = d.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= 7;
        });

        const upcomingBreakdown = upcomingTasks.reduce((acc, t) => {
            const cat = getComplianceCategory(t.id);
            const shortCat = cat === 'Income Tax' ? 'IT' : cat;
            acc[shortCat] = (acc[shortCat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            dueTodayTasks,
            dueTodayBreakdown,
            overdueTasks,
            oldestOverdueDays,
            awaitingClientTasks,
            pendingReviewTasks,
            overloadedStaffCount,
            upcomingTasks,
            upcomingBreakdown
        };
    }, [tasks, complianceTypes, today.getTime()]);


    // --- Render ---

    const Card = ({
        title,
        value,
        subtitle,
        icon: Icon,
        colorClass,
        bgClass,
        onClick
    }: {
        title: string,
        value: string | number,
        subtitle?: React.ReactNode,
        icon: any,
        colorClass: string,
        bgClass: string,
        onClick: () => void
    }) => (
        <div
            onClick={onClick}
            className={`${bgClass} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-gray-200`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <div className="flex flex-col">
                <span className={`text-2xl font-bold ${colorClass.replace('bg-', 'text-')}`}>{value}</span>
                {subtitle && <div className="mt-2 text-xs text-gray-500">{subtitle}</div>}
            </div>
        </div>
    );

    const { dueTodayTasks, dueTodayBreakdown, overdueTasks, oldestOverdueDays, awaitingClientTasks, pendingReviewTasks, overloadedStaffCount, upcomingTasks, upcomingBreakdown } = insights;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Due Today */}
            <Card
                title="Due Today"
                value={dueTodayTasks.length}
                icon={Calendar}
                bgClass="bg-blue-50"
                colorClass="text-blue-600"
                subtitle={
                    <div className="flex space-x-2">
                        {Object.entries(dueTodayBreakdown).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="font-medium text-blue-700">{k}: {v}</span>
                        ))}
                    </div>
                }
                onClick={() => navigate('/dashboard/tasks?timeline=today')}
            />

            {/* 2. Overdue */}
            <Card
                title="Overdue"
                value={overdueTasks.length}
                icon={AlertCircle}
                bgClass="bg-red-50"
                colorClass="text-red-600"
                subtitle={overdueTasks.length > 0 ? `Oldest ${oldestOverdueDays} days` : 'All clear'}
                onClick={() => navigate('/dashboard/tasks?timeline=overdue')}
            />

            {/* 3. Awaiting Client Data */}
            <Card
                title="Awaiting Client Data"
                value={awaitingClientTasks.length}
                icon={Clock}
                bgClass="bg-orange-50"
                colorClass="text-orange-600"
                onClick={() => navigate('/dashboard/tasks?status=awaiting_client_data')}
            />

            {/* 4. Pending Partner Review */}
            <Card
                title="Pending Partner Review"
                value={pendingReviewTasks.length}
                icon={CheckSquare}
                bgClass="bg-green-50"
                colorClass="text-green-600"
                onClick={() => navigate('/dashboard/tasks?status=ready_for_review')}
            />

            {/* 5. Staff Overloaded */}
            <Card
                title="Staff Overloaded"
                value={overloadedStaffCount}
                icon={Users}
                bgClass="bg-yellow-50"
                colorClass="text-yellow-600"
                subtitle={overloadedStaffCount > 0 ? '> 5 active tasks' : 'Load balanced'}
                onClick={() => navigate('/dashboard/staff?filter=overloaded')}
            />

            {/* 6. Upcoming */}
            <Card
                title="Upcoming (7 Days)"
                value={upcomingTasks.length}
                icon={TrendingUp}
                bgClass="bg-purple-50"
                colorClass="text-purple-600"
                subtitle={
                    <div className="flex space-x-2">
                        {Object.entries(upcomingBreakdown).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="font-medium text-purple-700">{k}: {v}</span>
                        ))}
                    </div>
                }
                onClick={() => navigate('/dashboard/tasks?timeline=upcoming')}
            />
        </div>
    );
};

export default InsightCards;
