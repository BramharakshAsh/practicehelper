"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const App = dynamic(() => import("@/App"), { ssr: false });
import { BrowserRouter } from "react-router-dom";

export default function SPAMount() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Suppress console messages from Vite if needed
        (window as any).importMetaEnv = { DEV: false };
    }, []);

    if (!isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <BrowserRouter basename="/app">
            <App />
        </BrowserRouter>
    );
}
