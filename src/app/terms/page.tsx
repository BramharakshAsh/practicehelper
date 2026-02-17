import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "The rules and guidelines for using CAControl.",
};

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">Terms of Service</h1>
            <div className="prose prose-lg">
                <p>Last updated: February 16, 2026</p>
                <p>By using CAControl, you agree to the following terms and conditions.</p>
                <h2 className="text-3xl font-bold mt-12 mb-4">User Conduct</h2>
                <p>Users must comply with all local regulations while using our platform.</p>
                <div className="mt-20">
                    <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
                </div>
            </div>
        </div>
    );
}
