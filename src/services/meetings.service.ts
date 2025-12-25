import { Meeting } from '../types';
import { useAuthStore } from '../store/auth.store';
import { LocalStorageService } from './local-storage.service';
import { clientsService } from './clients.service';
import { staffService } from './staff.service';

const MEETINGS_KEY = 'ca_practice_manager_meetings';

class MeetingsService {
    async getMeetings(): Promise<Meeting[]> {
        const meetings = LocalStorageService.getItem<Meeting[]>(MEETINGS_KEY, []);
        const clients = await clientsService.getClients();
        const staff = await staffService.getStaff();

        return meetings.map(meeting => ({
            ...meeting,
            client: clients.find(c => c.id === meeting.client_id),
            staff: staff.find(s => s.id === meeting.staff_id),
        }));
    }

    async createMeeting(meeting: Omit<Meeting, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated or missing firm ID');

        const meetings = LocalStorageService.getItem<Meeting[]>(MEETINGS_KEY, []);
        const newMeeting: Meeting = {
            ...meeting,
            id: crypto.randomUUID(),
            firm_id: firmId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        meetings.push(newMeeting);
        LocalStorageService.setItem(MEETINGS_KEY, meetings);

        const clients = await clientsService.getClients();
        const staff = await staffService.getStaff();
        return {
            ...newMeeting,
            client: clients.find(c => c.id === newMeeting.client_id),
            staff: staff.find(s => s.id === newMeeting.staff_id),
        };
    }

    async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
        const meetings = LocalStorageService.getItem<Meeting[]>(MEETINGS_KEY, []);
        const index = meetings.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Meeting not found');

        const updatedMeeting = {
            ...meetings[index],
            ...updates,
            updated_at: new Date().toISOString(),
        };

        meetings[index] = updatedMeeting;
        LocalStorageService.setItem(MEETINGS_KEY, meetings);

        const clients = await clientsService.getClients();
        const staff = await staffService.getStaff();
        return {
            ...updatedMeeting,
            client: clients.find(c => c.id === updatedMeeting.client_id),
            staff: staff.find(s => s.id === updatedMeeting.staff_id),
        };
    }

    async deleteMeeting(id: string): Promise<void> {
        const meetings = LocalStorageService.getItem<Meeting[]>(MEETINGS_KEY, []);
        const filtered = meetings.filter(m => m.id !== id);
        LocalStorageService.setItem(MEETINGS_KEY, filtered);
    }
}

export const meetingsService = new MeetingsService();
