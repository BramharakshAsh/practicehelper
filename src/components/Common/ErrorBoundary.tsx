import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { devError } from '../../services/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        devError('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-red-100 p-4 rounded-full">
                                <AlertCircle className="h-12 w-12 text-red-600" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                        <p className="text-gray-600 mb-8">
                            An unexpected error occurred. We've been notified and are working on it.
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <RefreshCw className="h-5 w-5" />
                                <span>Reload Application</span>
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="w-full text-gray-600 hover:text-gray-900 font-medium py-2"
                            >
                                Go Back
                            </button>
                        </div>
                        {/* Environment-safe check for development mode */}
                        {(typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (import.meta as any).env?.DEV) && this.state.error && (
                            <div className="mt-8 text-left">
                                <div className="p-4 bg-gray-100 rounded-lg overflow-auto border border-gray-200 shadow-inner">
                                    <p className="text-xs font-mono text-red-800 break-words font-semibold mb-2 uppercase tracking-wider">Error Details:</p>
                                    <p className="text-xs font-mono text-gray-800 break-words leading-relaxed">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
