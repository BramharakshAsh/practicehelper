import React from 'react';
import { Users, FileText, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { DashboardStats as StatsType } from '../../types';

interface DashboardStatsProps {
  stats: StatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Clients',
      value: stats.total_clients,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Total Staff',
      value: stats.total_staff,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdue_tasks,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      title: 'Pending Review',
      value: stats.pending_review,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      title: 'Completed Today',
      value: stats.completed_today,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: 'Upcoming Due Dates',
      value: stats.upcoming_due_dates,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`${card.bgColor} rounded-xl p-6 transition-transform hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor} opacity-80`}>{card.title}</p>
                <p className={`text-3xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;