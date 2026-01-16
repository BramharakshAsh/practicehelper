import React, { useState, useEffect, createContext, useContext } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { walkthroughSteps } from './steps';

interface WalkthroughContextType {
    restartWalkthrough: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

interface WalkthroughProviderProps {
    children: React.ReactNode;
}

export const WalkthroughProvider: React.FC<WalkthroughProviderProps> = ({ children }) => {
    const [run, setRun] = useState(false);
    const [steps] = useState<Step[]>(walkthroughSteps);
    const [tourKey, setTourKey] = useState(0);
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
        const isDashboard = location.pathname.startsWith('/dashboard');

        if (!hasSeenWalkthrough && isAuthenticated && isDashboard) {
            // Delay to ensure dashboard content is rendered
            const timer = setTimeout(() => {
                setRun(true);
            }, 1500);
            return () => clearTimeout(timer);
        } else if (!isDashboard || !isAuthenticated) {
            setRun(false);
        }
    }, [location.pathname, isAuthenticated]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hasSeenWalkthrough', 'true');
        }
    };

    const restartWalkthrough = () => {
        localStorage.removeItem('hasSeenWalkthrough');
        setTourKey(prev => prev + 1);
        setRun(true);
    };

    return (
        <WalkthroughContext.Provider value={{ restartWalkthrough }}>
            <Joyride
                key={tourKey}
                steps={steps}
                run={run}
                continuous
                showProgress
                showSkipButton
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#3b82f6', // Match app's primary blue
                        zIndex: 10000,
                    },
                }}
            />
            {children}
        </WalkthroughContext.Provider>
    );
};

export const useWalkthrough = () => {
    const context = useContext(WalkthroughContext);
    if (context === undefined) {
        throw new Error('useWalkthrough must be used within a WalkthroughProvider');
    }
    return context;
};
