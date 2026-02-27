import * as React from 'react';
const { useEffect, useState } = React;
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useAuthStore } from '../store/auth.store';
import { useMeetingsStore } from '../store/meetings.store';
import { useClientsStore } from '../store/clients.store';
import { useStaffStore } from '../store/staff.store';
import CalendarView from '../components/Calendar/CalendarView';
import MeetingModal from '../components/Calendar/MeetingModal';

const CalendarPage: React.FC = () => {
    const { tasks } = useTasks();
    const { user } = useAuthStore();
    const { meetings, fetchMeetings, createMeeting } = useMeetingsStore();
    const { clients } = useClientsStore();
    const { staff } = useStaffStore();

    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [filterStaffId, setFilterStaffId] = useState<string>(
        ['staff', 'paid_staff', 'articles'].includes(user?.role || '') ? (user?.id || '') : 'all'
    );

    useEffect(() => {
        fetchMeetings();
    }, []);

    const activeStaffId = filterStaffId === 'all' ? undefined : filterStaffId;

    const handleCreateMeeting = async (meetingData: any) => {
        try {
            await createMeeting({
                ...meetingData,
                created_by: user?.id || ''
            });
            // fetchMeetings is automatic if store updates state, but createMeeting updates local state too
        } catch (error) {
            console.error('Failed to create meeting:', error);
            alert('Failed to schedule meeting. Please try again.');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
                    <p className="text-sm text-gray-600 mt-1">Track due dates and important deadlines</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {!['staff', 'paid_staff', 'articles'].includes(user?.role || '') && (
                        <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">View:</span>
                            <select
                                value={filterStaffId}
                                onChange={(e) => setFilterStaffId(e.target.value)}
                                className="bg-transparent text-sm font-medium focus:outline-none"
                            >
                                <option value="all">Firm Overview (All)</option>
                                <optgroup label="Staff Members">
                                    {staff.map(s => (
                                        <option key={s.id} value={s.user_id}>{s.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => setShowMeetingModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 transform transition-transform text-sm font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Schedule Meeting</span>
                    </button>
                </div>
            </div>

            <CalendarView
                tasks={tasks}
                meetings={meetings}
                currentRole={(['staff', 'paid_staff', 'articles'].includes(user?.role || '') || activeStaffId) ? 'staff' : 'partner'}
                currentStaffId={activeStaffId}
                selectedStaffRole={activeStaffId ? staff.find(s => s.user_id === activeStaffId)?.role : undefined}
            />

            {showMeetingModal && (
                <MeetingModal
                    clients={clients}
                    staff={staff}
                    onClose={() => setShowMeetingModal(false)}
                    onSubmit={handleCreateMeeting}
                />
            )}
        </div>
    );
};

export default CalendarPage;
