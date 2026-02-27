import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from '../utils/env';
import { devLog, devWarn, devError } from './logger';
import { logActivity } from './freeze-detector';

let supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
    );
}

devLog('[Supabase] Initializing client for:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    db: {
        schema: 'public'
    },
    global: {
        fetch: async (url, options) => {
            const response = await fetch(url, options);

            // Detect auth failures on data endpoints → force recovery
            // IMPORTANT: Skip auth endpoints (login, signup, token refresh)
            // to avoid killing a login attempt that returns 401 for bad credentials
            if (response.status === 401 || response.status === 403) {
                const urlStr = typeof url === 'string' ? url : '';
                const isAuthEndpoint = urlStr.includes('/auth/');
                const isDataEndpoint = urlStr.includes('/rest/') || urlStr.includes('/rpc/');
                if (!isAuthEndpoint && isDataEndpoint) {
                    devWarn('[Supabase] Auth error on data API call, forcing recovery');
                    forceAuthRecovery();
                }
            }

            return response;
        }
    }
});

// ──────────────────────────────────────────────
// Fix #3: Centralized safe API wrapper
// Wraps any Supabase operation with auth-error recovery.
// If a call fails with an auth error, signs out and reloads.
// ──────────────────────────────────────────────
export async function safeApi<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (isAuthError(error)) {
            devError('[safeApi] Auth error caught, forcing recovery:', error.message);
            forceAuthRecovery();
            // The reload will prevent this from actually resolving,
            // but we still need to satisfy the return type.
            throw error;
        }
        throw error;
    }
}

function isAuthError(error: any): boolean {
    if (!error) return false;
    const message = (error.message || error.msg || '').toLowerCase();
    const status = error.status || error.statusCode;
    return (
        status === 401 ||
        status === 403 ||
        message.includes('jwt expired') ||
        message.includes('invalid jwt') ||
        message.includes('token is expired') ||
        message.includes('not authenticated') ||
        message.includes('invalid claim') ||
        message.includes('session_not_found')
    );
}

// ──────────────────────────────────────────────
// Auth recovery — wipe tokens and redirect
// Called when we detect an unrecoverable auth state.
// ──────────────────────────────────────────────
let isRecovering = false;

// Track recovery attempts to prevent infinite loops
const RECOVERY_KEY = 'auth-recovery-attempts';
const MAX_RECOVERIES_PER_MINUTE = 2; // Allow at most 2 recoveries per minute

function getRecoveryAttempts(): number[] {
    try {
        const stored = localStorage.getItem(RECOVERY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function recordRecoveryAttempt() {
    const attempts = getRecoveryAttempts();
    const now = Date.now();
    // Keep only attempts within the last minute
    const recent = attempts.filter(t => now - t < 60000);
    recent.push(now);
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(recent));
    return recent.length;
}

export function forceAuthRecovery() {
    if (isRecovering) return;

    // Check if we are looping
    const attempts = recordRecoveryAttempt();
    if (attempts > MAX_RECOVERIES_PER_MINUTE) {
        devError(`[Supabase] Too many auth recovery attempts (${attempts}). Aborting to prevent loop.`);
        return; // STOP! Don't clear tokens, don't redirect. Let the user decide what to do or refresh manually.
    }

    isRecovering = true;

    // Auto-reset after 10 seconds so recovery can be re-triggered on next failure
    setTimeout(() => { isRecovering = false; }, 10_000);

    logActivity('forceAuthRecovery: triggered');
    devWarn('[Supabase] ⚠️ Force auth recovery triggered');

    // 1. Sign out from Supabase (fire-and-forget, don't await)
    supabase.auth.signOut().catch(() => { });

    // 2. Wipe Supabase auth tokens from localStorage
    try {
        const urlToSplit = supabaseUrl || '';
        const parts = urlToSplit.split('//')[1]?.split('.');
        if (parts && parts[0]) {
            const sbKey = `sb-${parts[0]}-auth-token`;
            localStorage.removeItem(sbKey);
        }
    } catch (e) { }

    // 3. Wipe Supabase IndexedDB
    try {
        indexedDB.deleteDatabase('supabase-auth');
    } catch (e) { }

    // 4. Schedule app data cleanup
    scheduleAppDataCleanup();

    // 5. Redirect to login
    window.location.href = '/login';
}

// ──────────────────────────────────────────────
// Delayed app data cleanup
// Clears app-specific localStorage keys after 5 seconds.
// Called after both manual logout and error recovery.
// Preserves the 'debug' key (developer setting).
// ──────────────────────────────────────────────
const APP_DATA_KEYS = [
    'firm-flow-timer-storage',
    'sidebar-collapsed',
    'hasSeenWalkthrough',
];

export function scheduleAppDataCleanup() {
    setTimeout(() => {
        devLog('[Cleanup] Clearing app stored data');
        APP_DATA_KEYS.forEach(key => {
            try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
        });
    }, 1000); // reduced to 1s
}

// ──────────────────────────────────────────────
// Idle session check with retry
// Periodically validates the session is still alive.
// Only forces recovery after 3 consecutive failures.
// ──────────────────────────────────────────────
const IDLE_CHECK_INTERVAL = 5 * 60_000; // every 5 minutes
const MAX_IDLE_FAILURES = 3;

let idleCheckTimer: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;

export function startIdleSessionCheck() {
    stopIdleSessionCheck(); // clear any existing timer
    consecutiveFailures = 0;

    idleCheckTimer = setInterval(async () => {
        logActivity('idleCheck: running');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Success — reset failure counter
                consecutiveFailures = 0;
            } else {
                consecutiveFailures++;
                devWarn(`[Supabase] Idle check: no valid user (attempt ${consecutiveFailures}/${MAX_IDLE_FAILURES})`);
                if (consecutiveFailures >= MAX_IDLE_FAILURES) {
                    forceAuthRecovery();
                }
            }
        } catch (error) {
            consecutiveFailures++;
            devWarn(`[Supabase] Idle check failed (attempt ${consecutiveFailures}/${MAX_IDLE_FAILURES}):`, error);
            if (consecutiveFailures >= MAX_IDLE_FAILURES) {
                forceAuthRecovery();
            }
        }
    }, IDLE_CHECK_INTERVAL);
}

export function stopIdleSessionCheck() {
    if (idleCheckTimer) {
        clearInterval(idleCheckTimer);
        idleCheckTimer = null;
    }
    consecutiveFailures = 0;
}



// Developer helpers
if (typeof window !== 'undefined') {
    (window as any).enableLogs = () => {
        localStorage.setItem('debug', 'true');
        console.log('Developer logs enabled. Please refresh the page.');
    };
    (window as any).disableLogs = () => {
        localStorage.removeItem('debug');
        console.log('Developer logs disabled. Please refresh the page.');
    };
}
