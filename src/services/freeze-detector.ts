import { isDev } from '../utils/env';

const HEARTBEAT_INTERVAL = 1000; // Check every 1 second
const FREEZE_THRESHOLD = 3000;   // Consider frozen if > 3 seconds between beats

let lastBeatTime = Date.now();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

// Track recent activity for debugging
const recentActivity: string[] = [];
const MAX_ACTIVITY_LOG = 20;

export function logActivity(label: string) {
    const now = new Date().toLocaleTimeString();
    recentActivity.push(`[${now}] ${label}`);
    if (recentActivity.length > MAX_ACTIVITY_LOG) {
        recentActivity.shift();
    }
}

export function startFreezeDetector() {
    if (isRunning || !isDev()) return;
    isRunning = true;
    lastBeatTime = Date.now();

    console.log('%c[FreezeDetector] Started — will report main thread blocks > 3s', 'color: #22c55e; font-weight: bold');

    heartbeatTimer = setInterval(() => {
        const now = Date.now();
        const gap = now - lastBeatTime;

        if (gap > FREEZE_THRESHOLD) {
            console.warn(
                `%c[FreezeDetector] ⚠️ MAIN THREAD WAS BLOCKED for ${(gap / 1000).toFixed(1)}s!`,
                'color: #ef4444; font-weight: bold; font-size: 14px'
            );
            console.warn('[FreezeDetector] Recent activity before freeze:', [...recentActivity]);

            // Also report JS heap usage if available
            if ((performance as any).memory) {
                const mem = (performance as any).memory;
                console.warn(`[FreezeDetector] JS Heap: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`);
            }
        }

        lastBeatTime = now;
    }, HEARTBEAT_INTERVAL);
}

export function stopFreezeDetector() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
    isRunning = false;
}
