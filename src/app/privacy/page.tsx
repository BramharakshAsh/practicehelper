import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Learn how CAControl handles and protects your data.",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">Privacy Policy</h1>
            <div className="prose prose-lg">
                <p>Last updated: February 16, 2026</p>
                <p>Your privacy is important to us. This policy outlines how CAControl collects, uses, and protects your information.</p>
                <h2 className="text-3xl font-bold mt-12 mb-4">Data Collection</h2>
                <p>We collect information necessary to provide our practice management services.</p>
                <div className="mt-20">
                    <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
                </div>
            </div>
        </div>
    );
}
