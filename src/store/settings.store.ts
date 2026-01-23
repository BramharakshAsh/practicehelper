import { create } from 'zustand';
import { Firm } from '../types';
import { settingsService } from '../services/settings.service';

interface SettingsState {
    firm: Firm | null;
    isLoading: boolean;
    hasFetched: boolean;
    error: string | null;

    fetchFirmProfile: () => Promise<void>;
    updateFirmProfile: (updates: Partial<Firm>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    firm: null,
    isLoading: false,
    hasFetched: false,
    error: null,

    fetchFirmProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            const firm = await settingsService.getFirmProfile();
            set({ firm, isLoading: false, hasFetched: true });
        } catch (error: any) {
            set({ error: error.message, isLoading: false, hasFetched: true });
        }
    },

    updateFirmProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
            const firm = await settingsService.updateFirmProfile(updates);
            set({ firm, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    }
}));
