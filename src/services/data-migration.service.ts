import { LocalStorageService } from './local-storage.service';

const DATA_VERSION_KEY = 'ca_practice_manager_data_version';
const CURRENT_DATA_VERSION = '2.0'; // Updated for hierarchical compliance types

export class DataMigrationService {
    static checkAndMigrateData(): boolean {
        const currentVersion = LocalStorageService.getItem<string>(DATA_VERSION_KEY, '1.0');

        if (currentVersion !== CURRENT_DATA_VERSION) {
            console.log(`Migrating data from version ${currentVersion} to ${CURRENT_DATA_VERSION}`);
            this.clearOldData();
            LocalStorageService.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
            return true; // Data was reset
        }

        return false; // No migration needed
    }

    static clearOldData(): void {
        const keysToKeep = [DATA_VERSION_KEY];
        const allKeys = Object.keys(localStorage);

        allKeys.forEach(key => {
            if (key.startsWith('ca_practice_manager_') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        console.log('Old data cleared. Please reload the page to load fresh data.');
    }

    static forceReset(): void {
        localStorage.clear();
        window.location.reload();
    }
}
