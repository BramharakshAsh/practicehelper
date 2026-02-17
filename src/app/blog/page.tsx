import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Blog",
    description: "Insights and updates for modern accounting firms. Learn about practice management and compliance automation.",
};

export default function BlogPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">CAControl Blog</h1>
            <p className="text-xl text-gray-600 mb-12">Insights and updates for modern accounting firms.</p>

            <div className="space-y-12">
                <article>
                    <h2 className="text-3xl font-bold mb-2">Automating Your Firm's Workflow</h2>
                    <p className="text-gray-500 mb-4">Posted on February 14, 2026</p>
                    <p className="text-lg leading-relaxed mb-4">
                        In today's fast-paced environment, manual task tracking is no longer sufficient for growing CA firms...
                    </p>
                    <a href="#" className="text-brand-primary font-bold hover:underline">Read More →</a>
                </article>
            </div>

            <div className="mt-20">
                <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
            </div>
        </div>
    );
}
