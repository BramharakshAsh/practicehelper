import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { devLog } from '../../services/logger';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        devLog('[ProtectedRoute] Not authenticated, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    if (roles && user && !roles.includes(user.role)) {
        devLog('[ProtectedRoute] User role', user.role, 'not in allowed roles:', roles);
        return <Navigate to="/dashboard" replace />;
    }

    if (user?.login_blocked && user.role !== 'partner') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8 text-center animate-slide-up">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Locked</h2>
                    <p className="text-gray-600 mb-6 font-medium">
                        Your account has been restricted due to consecutive missed Daily Work Closures.
                    </p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                        Please contact your Firm Admin or Partner to re-enable your access.
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('auth-store');
                            window.location.href = '/login';
                        }}
                        className="mt-6 w-full py-3 px-4 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
