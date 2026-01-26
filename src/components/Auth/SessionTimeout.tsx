import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/auth.store';

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * SessionTimeout component handles:
 * 1. Inactivity timeout (10 minutes)
 * 2. Logout on tab close or page refresh
 */
export const SessionTimeout = () => {
    const { logout, isAuthenticated } = useAuthStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isAuthenticatedRef = useRef(isAuthenticated);

    // Keep ref in sync
    isAuthenticatedRef.current = isAuthenticated;

    const lastActivityRef = useRef<number>(Date.now());

    // Stabilize handleLogout - only depends on logout function
    const handleLogout = useCallback(async () => {
        if (isAuthenticatedRef.current) {
            console.log('SessionTimeout: Logging out user due to inactivity or window closure.');
            await logout();
        }
    }, [logout]);

    // Throttled reset timer - only resets if > 30s has passed significantly reduces CPU usage on mousemove
    const resetInactivityTimer = useCallback(() => {
        const now = Date.now();
        // Throttle: Only reset if more than 30 seconds have passed since the last reset
        // causing less overhead for high-frequency events like mousemove/scroll
        if (now - lastActivityRef.current < 30000 && timeoutRef.current) {
            return;
        }

        lastActivityRef.current = now;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (isAuthenticatedRef.current) {
            timeoutRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT);
        }
    }, [handleLogout]);

    useEffect(() => {
        if (!isAuthenticated) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            return;
        }

        // List of events that reset the inactivity timer
        // Optimized: Removed 'mousemove' and 'scroll' to prevent performance issues
        // Only tracking explicit actions now as per user request
        const events = [
            'click',
            'keydown',
            'focus',
            'input' // Added input to catch typing in form fields
        ];

        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        resetInactivityTimer();

        // Cleanup function - CRITICAL: remove all listeners
        return () => {
            console.log('[SessionTimeout] Cleaning up activity listeners');
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isAuthenticated, resetInactivityTimer]);

    return null;
};
