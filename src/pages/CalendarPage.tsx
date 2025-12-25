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

    useEffect(() => {
        fetchMeetings();
    }, []);

    const currentRole = user?.role || 'staff';
    const currentStaffId = user?.role === 'staff' ? user.id : undefined;

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
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowMeetingModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    <span>Schedule Meeting</span>
                </button>
            </div>

            <CalendarView
                tasks={tasks}
                meetings={meetings}
                currentRole={currentRole as 'partner' | 'staff'}
                currentStaffId={currentStaffId}
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
