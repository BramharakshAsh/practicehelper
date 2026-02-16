import React from 'react';

export default function GuidePage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">Quick Start Guide</h1>
            <div className="prose prose-lg">
                <p className="text-xl text-gray-600 mb-6">
                    Learn how to streamline your CA firm's workflow with CAControl.
                    This guide covers everything from client onboarding to automated task generation.
                </p>

                <h2 className="text-3xl font-bold mt-12 mb-4">1. Onboarding Your Firm</h2>
                <p className="mb-6">
                    Start by registering your organization and inviting your staff members.
                    You can import your entire client list via a single Excel file.
                </p>

                <h2 className="text-3xl font-bold mt-12 mb-4">2. Managing Tasks</h2>
                <p className="mb-6">
                    Use the Kanban dashboard to assign and track tasks.
                    Set compliance periods for automatic task generation.
                </p>

                {/* Links as anchor tags for link discovery */}
                <div className="mt-12 flex gap-4">
                    <a href="/pricing" className="text-brand-primary font-bold hover:underline">View Pricing</a>
                    <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
                </div>
            </div>
        </div>
    );
}
