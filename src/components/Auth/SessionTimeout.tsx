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

    // Stabilize handleLogout - only depends on logout function
    const handleLogout = useCallback(async () => {
        if (isAuthenticatedRef.current) {
            console.log('SessionTimeout: Logging out user due to inactivity or window closure.');
            await logout();
        }
    }, [logout]);

    // Stabilize resetInactivityTimer - only depends on handleLogout
    const resetInactivityTimer = useCallback(() => {
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

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const resetTimer = () => resetInactivityTimer();

        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        resetInactivityTimer();

        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isAuthenticated, resetInactivityTimer]);

    return null;
};
