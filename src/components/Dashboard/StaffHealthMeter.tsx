import React from 'react';
import { Task } from '../../types';
import { Activity, ShieldAlert, UserCheck } from 'lucide-react';
import { calculateLiveHealthScore } from '../../utils/healthScore';

interface StaffHealthMeterProps {
    tasks: Task[];
    staffName?: string;
}

const StaffHealthMeter: React.FC<StaffHealthMeterProps> = ({ tasks, staffName }) => {
    // Filter to only active tasks assigned to this staff member
    // Assuming the tasks prop passed in is already filtered for the specific staff member
    // or we filter the assigned tasks up tree. Usually easier to expect fully filtered tasks.
    const activeTasks = tasks.filter(t => t.status !== 'filed_completed');
    const health = calculateLiveHealthScore(activeTasks);

    const score = health.total_score || 0;

    // Determine colors and labels based on score ranges
    let scoreColor = 'text-green-600';
    let bgRingColor = 'text-green-500';
    let textState = 'Controlled';
    let stateDescription = 'Your tasks are moving smoothly and on time.';
    let iconBg = 'bg-green-100';

    if (score < 65) {
        scoreColor = 'text-red-600';
        bgRingColor = 'text-red-500';
        textState = 'Danger';
        stateDescription = 'Immediate action required on your bottlenecks.';
        iconBg = 'bg-red-100';
    } else if (score < 85) {
        scoreColor = 'text-yellow-600';
        bgRingColor = 'text-yellow-500';
        textState = 'Risk';
        stateDescription = 'Attention needed on your reporting or deadlines.';
        iconBg = 'bg-yellow-100';
    }

    // Circumference for the circular SVG meter
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col items-center border border-slate-100 shadow-sm relative overflow-hidden">

            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <UserCheck className="w-32 h-32" />
            </div>

            <div className="flex items-center justify-between w-full mb-6 relative z-10">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    {staffName ? `${staffName}'s Health` : 'Your Health'}
                </h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${iconBg} ${scoreColor} uppercase tracking-wider`}>
                    {textState}
                </span>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center py-2 relative z-10">
                {/* SVG Radial Meter */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Background Ring */}
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-100"
                        />
                        {/* Foreground Progress Ring */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ease-out ${bgRingColor}`}
                        />
                    </svg>

                    {/* Numeric Score */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-black ${scoreColor}`}>{Math.round(score)}</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">Score</span>
                    </div>
                </div>

                {/* State Description */}
                <p className="text-center text-sm font-medium text-gray-600 mt-4 max-w-[200px]">
                    {stateDescription}
                </p>
            </div>

            {/* Impact Factor */}
            {health?.biggest_impact_factor && (
                <div className="w-full mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 relative z-10">
                    <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Impact Factor</span>
                        <span className="text-sm font-medium text-slate-700 leading-snug block">
                            {health.biggest_impact_factor}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffHealthMeter;
