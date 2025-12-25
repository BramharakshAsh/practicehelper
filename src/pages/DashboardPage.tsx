import * as React from 'react';
import { useTasksStore } from '../store/tasks.store';
import { useClientsStore } from '../store/clients.store';
import { useStaffStore } from '../store/staff.store';
import DashboardStats from '../components/Dashboard/DashboardStats';
import RecentTasks from '../components/Dashboard/RecentTasks';

const DashboardPage: React.FC = () => {
    const { tasks } = useTasksStore();
    const { clients } = useClientsStore();
    const { staff } = useStaffStore();

    const recentTasks = tasks.slice(0, 5);
    const urgentTasks = tasks.filter(task => {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && task.status !== 'filed_completed';
    });

    const dashboardStats = {
        total_clients: clients.length,
        total_staff: staff.length,
        overdue_tasks: tasks.filter(task => new Date(task.due_date) < new Date() && task.status !== 'filed_completed').length,
        pending_review: tasks.filter(task => task.status === 'ready_for_review').length,
        completed_today: tasks.filter(task => {
            const today = new Date().toDateString();
            return task.status === 'filed_completed' && new Date(task.updated_at).toDateString() === today;
        }).length,
        upcoming_due_dates: urgentTasks.length,
    };

    return (
        <div className="space-y-8">
            <DashboardStats stats={dashboardStats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentTasks tasks={recentTasks} title="Recent Tasks" />
                <RecentTasks tasks={urgentTasks} title="Urgent Tasks (Next 7 Days)" />
            </div>
        </div>
    );
};

export default DashboardPage;
