/**
 * Centralized debug logger.
 * Logs only in development mode OR when localStorage.debug === 'true'.
 *
 * Usage:
 *   import { devLog, devWarn, devError } from '../services/logger';
 *   devLog('[MyStore] action called');
 *   devWarn('[MyStore] something unexpected');
 *   devError('[MyStore] failed:', error);
 *
 * Enable in production console:
 *   localStorage.setItem('debug', 'true'); location.reload();
 *
 * Disable:
 *   localStorage.removeItem('debug'); location.reload();
 */

function isDebugEnabled(): boolean {
    try {
        return import.meta.env.DEV || localStorage.getItem('debug') === 'true';
    } catch {
        return false;
    }
}

export function devLog(...args: any[]) {
    if (isDebugEnabled()) console.log(...args);
}

export function devWarn(...args: any[]) {
    if (isDebugEnabled()) console.warn(...args);
}

export function devError(...args: any[]) {
    // Errors always log — they're important regardless of debug mode
    console.error(...args);
}
