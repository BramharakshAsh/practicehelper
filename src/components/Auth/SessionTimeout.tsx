import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/auth.store';

/**
 * SessionTimeout component handles:
 * 1. Inactivity timeout (10 minutes)
 * 2. Logout on tab close or page refresh
 */
export const SessionTimeout = () => {
    const { logout, isAuthenticated } = useAuthStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds

    const handleLogout = useCallback(async () => {
        if (isAuthenticated) {
            console.log('SessionTimeout: Logging out user due to inactivity or window closure.');
            await logout();
        }
    }, [logout, isAuthenticated]);

    const resetInactivityTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (isAuthenticated) {
            timeoutRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT);
        }
    }, [handleLogout, isAuthenticated, INACTIVITY_LIMIT]);

    useEffect(() => {
        if (!isAuthenticated) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            return;
        }

        // List of events that reset the inactivity timer
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        const resetTimer = () => resetInactivityTimer();

        // Add activity listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer on mount/auth
        resetInactivityTimer();

        // Handle logout on page refresh or tab close
        const handleUnload = () => {
            // We call logout here. Since it's beforeunload, we can't reliably await it,
            // but the auth store's logout synchronously clears local state/storage 
            // after the async call (which might be cancelled by the browser), 
            // ensuring the user is logged out when they return or reload.
            handleLogout();
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            // Cleanup listeners
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            window.removeEventListener('beforeunload', handleUnload);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isAuthenticated, resetInactivityTimer, handleLogout]);

    return null;
};
