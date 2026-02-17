"use client";

import React from 'react';
import { UniversalLink as Link } from '../Common/UniversalLink';
import { Menu, X } from 'lucide-react';
import { CAControlLogo } from '../Common/CAControlLogo';

export const LandingHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center">
                        <CAControlLogo size="lg" />
                        <span className="hidden">CAControl</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-brand-primary transition-colors font-medium">Features</a>
                        <a href="#about" className="text-gray-600 hover:text-brand-primary transition-colors font-medium">About</a>
                        <a href="#benefits" className="text-gray-600 hover:text-brand-primary transition-colors font-medium">Benefits</a>
                        <a href="#pricing" className="text-gray-600 hover:text-brand-primary transition-colors font-medium">Pricing</a>
                        <Link to="/app/login" className="text-gray-600 hover:text-brand-primary transition-colors font-medium">Login</Link>
                        <Link
                            to="/app/login"
                            className="bg-brand-primary text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all hover:bg-orange-600"
                        >
                            Register for Free
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-4 shadow-xl">
                    <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">Features</a>
                    <a href="#about" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">About</a>
                    <a href="#benefits" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">Benefits</a>
                    <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium">Pricing</a>
                    <Link to="/app/login" className="block text-gray-600 font-medium">Login</Link>
                    <Link
                        to="/app/login"
                        className="block bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold text-center hover:bg-orange-600"
                    >
                        Register for Free
                    </Link>
                </div>
            )}
        </nav>
    );
};
