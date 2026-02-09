export class LocalStorageService {
    static getItem<T>(key: string, defaultValue: T): T {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        try {
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error parsing localStorage key "${key}":`, error);
            // If parsing fails, the data is corrupted. Remove it to prevent repeat failures.
            localStorage.removeItem(key);
            return defaultValue;
        }
    }

    static setItem<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }

    static removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    static clear(): void {
        localStorage.clear();
    }
}
