import React from 'react';
import { PricingSection } from '@/components/Marketing/Pricing';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Pricing - CAControl",
    description: "Simple and transparent pricing plans for CA firms of all sizes.",
};

export default function PricingPage() {
    return (
        <div className="pt-20">
            <PricingSection />
        </div>
    );
}
