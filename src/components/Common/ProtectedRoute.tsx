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

    return <>{children}</>;
};

export default ProtectedRoute;
