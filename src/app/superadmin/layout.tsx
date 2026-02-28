'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = sessionStorage.getItem('superadmin_token');
            if (storedToken) {
                try {
                    const res = await fetch('/api/superadmin/firms', {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    if (res.ok) {
                        setIsAuthenticated(true);
                    } else {
                        sessionStorage.removeItem('superadmin_token');
                    }
                } catch (err) {
                    console.error(err);
                }
            }
            setIsChecking(false);
        };
        checkAuth();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/superadmin/firms', {
                headers: { Authorization: `Bearer ${password}` }
            });

            if (res.ok) {
                sessionStorage.setItem('superadmin_token', password);
                setIsAuthenticated(true);
            } else {
                setError('Invalid superadmin password');
            }
        } catch (err) {
            setError('An error occurred during authentication');
        }
    };

    if (isChecking) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border">
                    <div className="p-6 space-y-1 text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold">Superadmin Portal</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enter developer credentials to access</p>
                    </div>
                    <div className="p-6 pt-0">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="Superadmin Password"
                                    className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                            <button
                                type="submit"
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                            >
                                Verify
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white dark:bg-gray-800 px-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-lg font-bold">CA Control - Superadmin Portal</h1>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <button
                        className="px-3 py-1.5 text-sm rounded-md border text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => {
                            sessionStorage.removeItem('superadmin_token');
                            setIsAuthenticated(false);
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
