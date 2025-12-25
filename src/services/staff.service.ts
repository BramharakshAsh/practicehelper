import { Staff } from '../types';
import { useAuthStore } from '../store/auth.store';
import { LocalStorageService } from './local-storage.service';

const STAFF_KEY = 'ca_practice_manager_staff';

class StaffService {
  async getStaff(): Promise<Staff[]> {
    return LocalStorageService.getItem<Staff[]>(STAFF_KEY, []);
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Staff> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const staffList = await this.getStaff();
    const id = crypto.randomUUID();

    const newStaff: Staff = {
      ...staffData,
      id,
      user_id: id,
      firm_id: firmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      is_available: true,
    };

    staffList.push(newStaff);
    LocalStorageService.setItem(STAFF_KEY, staffList);
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    const staffList = await this.getStaff();
    const index = staffList.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff member not found');

    const updatedStaff = {
      ...staffList[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    staffList[index] = updatedStaff;
    LocalStorageService.setItem(STAFF_KEY, staffList);
    return updatedStaff;
  }

  async getStaffById(id: string): Promise<Staff> {
    const staff = await this.getStaff();
    const found = staff.find(s => s.id === id);
    if (!found) throw new Error('Staff member not found');
    return found;
  }

  async deleteStaff(id: string): Promise<void> {
    const staffList = await this.getStaff();
    const filtered = staffList.filter(s => s.id !== id);
    LocalStorageService.setItem(STAFF_KEY, filtered);
  }

  async importStaff(staffList: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Staff[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const currentStaff = await this.getStaff();
    const newStaffItems = staffList.map(s => {
      const id = crypto.randomUUID();
      return {
        ...s,
        id,
        user_id: id,
        firm_id: firmId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_available: true,
      };
    });

    const updatedStaff = [...currentStaff, ...newStaffItems];
    LocalStorageService.setItem(STAFF_KEY, updatedStaff);
    return newStaffItems;
  }
}

export const staffService = new StaffService();