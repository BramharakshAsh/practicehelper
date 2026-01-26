import React from 'react';
import { Link } from 'react-router-dom';
import {
    Users, CheckSquare, Zap, ClipboardList,
    BarChart3, ShieldCheck, ArrowRight, PlayCircle,
    Menu, X, Compass, UserCheck, Settings,
    HelpCircle, Database, Check, Mail, Phone
} from 'lucide-react';
import { CAControlLogo } from '../components/Common/CAControlLogo';

const LandingPage: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-teal-100">
            {/* Navigation */}
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
                            <Link to="/login" className="text-gray-600 hover:text-brand-primary transition-colors font-medium">Login</Link>
                            <Link
                                to="/login"
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
                        <Link to="/login" className="block text-gray-600 font-medium">Login</Link>
                        <Link
                            to="/login"
                            className="block bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold text-center hover:bg-orange-600"
                        >
                            Register for Free
                        </Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center relative">
                        {/* Animated background blobs */}
                        <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>


                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
                            Deadlines under control, <br />
                            <span className="text-brand-primary">Workflow under control</span>
                        </h1>

                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                            The all-in-one practice management hub for CA practitioners and finance professionals.
                            Centralize clients, staff, tasks, and compliance—all in one sleek dashboard.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                            <Link
                                to="/login"
                                className="w-full sm:w-auto bg-brand-primary text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-orange-200/50 hover:scale-105 transition-all flex items-center justify-center group hover:bg-orange-600"
                            >
                                Register for Free
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/login"
                                className="w-full sm:w-auto bg-gray-50 text-gray-900 border border-gray-200 px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center"
                            >
                                <PlayCircle className="mr-2" />
                                Watch Demo
                            </Link>
                        </div>

                        <div className="mt-16 flex items-center justify-center space-x-8 text-sm text-gray-500 font-medium">
                            <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-brand-primary" /> No credit card required</span>
                            <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-brand-primary" /> Free to use for all firms</span>
                            <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-brand-primary" /> Instant setup</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to <span className="text-brand-primary">Manage Your Practice</span></h2>
                        <p className="text-lg text-gray-600">CAControl centralizes all your practice management needs into a single, intuitive platform.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-brand-primary" />}
                            title="Client Management"
                            description="Create, edit, and organize client profiles, contacts, and engagement history in one central hub."
                        />
                        <FeatureCard
                            icon={<CheckSquare className="w-8 h-8 text-brand-primary" />}
                            title="Task & Workload Scheduling"
                            description="Create tasks, set deadlines, assign to staff, and track progress via an intuitive Kanban board."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-brand-primary" />}
                            title="Auto-Task Generation"
                            description="Generate multiple tasks based on client-staff relations and compliance periods automatically."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-brand-primary" />}
                            title="Audit & Compliance"
                            description="Build detailed, checklist-based audit plans and keep ahead of regulatory deadlines."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-8 h-8 text-brand-primary" />}
                            title="Real-Time Dashboards"
                            description="Quick stats, alerts, and workload snapshots give you an instant overview of firm performance."
                        />
                        <FeatureCard
                            icon={<ClipboardList className="w-8 h-8 text-brand-primary" />}
                            title="Reporting & Export"
                            description="Generate comprehensive reports and export data to CSV for deeper analysis or offline use."
                        />
                    </div>
                </div>
            </section>

            {/* Why Choose Section (Image 3 Inspiration) */}
            <section id="benefits" className="py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Why Finance Professionals <span className="text-brand-primary">Choose CAControl</span>
                            </h2>
                            <p className="text-lg text-gray-600 mb-10">
                                Stop juggling spreadsheets and multiple tools. CAControl brings everything together
                                so you can focus on delivering value to your clients.
                            </p>

                            <div className="space-y-8">
                                <BenefitItem
                                    icon={<PlayCircle className="w-6 h-6" />}
                                    title="Instant Firm Overview"
                                    description="A single glance tells you client counts, upcoming tasks, and compliance deadlines."
                                />
                                <BenefitItem
                                    icon={<Users className="w-6 h-6" />}
                                    title="Efficient Staff Allocation"
                                    description="Role-based access ensures the right people see the right information."
                                />
                                <BenefitItem
                                    icon={<BarChart3 className="w-6 h-6" />}
                                    title="Compliance Assurance"
                                    description="Automated period selection and audit plans keep you ahead of deadlines."
                                />
                                <BenefitItem
                                    icon={<ShieldCheck className="w-6 h-6" />}
                                    title="Scalable & Secure"
                                    description="Enterprise-grade security with data encryption and secure authentication."
                                />
                            </div>
                        </div>

                        <div className="lg:w-1/2 relative">
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 transform hover:scale-[1.02] transition-transform duration-500">
                                <div className="flex justify-between mb-8">
                                    <h3 className="font-bold text-gray-900">Staff Workload</h3>
                                    <span className="text-sm text-gray-500">This Week</span>
                                </div>
                                <div className="space-y-6 mb-10">
                                    <WorkloadBar label="Alice Chen" progress={80} tasks={8} color="bg-brand-primary" />
                                    <WorkloadBar label="Bob Kumar" progress={45} tasks={5} color="bg-blue-500" />
                                    <WorkloadBar label="Carol Smith" progress={90} tasks={12} color="bg-indigo-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                        <div className="text-3xl font-bold text-gray-900">247</div>
                                        <div className="text-sm text-gray-600 font-medium">Active Clients</div>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                        <div className="text-3xl font-bold text-gray-900">89%</div>
                                        <div className="text-sm text-gray-600 font-medium">On-Time Tasks</div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative rings/blobs */}
                            <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-orange-50 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About the App Section */}
            <section id="about" className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">About the <span className="text-brand-primary">App</span></h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Practice Helper (CAControl) is designed to give you total control over your practice,
                            automating repetitive tasks and centralizing client data.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Getting Started */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-orange-50 rounded-2xl text-brand-primary">
                                    <PlayCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Getting Started</h3>
                            </div>
                            <ol className="space-y-4">
                                <li className="flex items-start">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-brand-primary flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                                    <p className="text-gray-600"><span className="font-bold text-gray-800">Log in</span> – Use your admin credentials. Land on the Dashboard to see real-time metrics and alerts immediately.</p>
                                </li>
                                <li className="flex items-start">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-brand-primary flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                                    <p className="text-gray-600"><span className="font-bold text-gray-800">Managing Clients</span> – Add engaged clients, fill details, and centralize engagement history in one pulse.</p>
                                </li>
                                <li className="flex items-start">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-brand-primary flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                                    <p className="text-gray-600"><span className="font-bold text-gray-800">Assign Tasks</span> – Create tasks for staff members. The system auto-suggests staff based on current workload.</p>
                                </li>
                            </ol>
                        </div>

                        {/* User Roles */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                    <UserCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Role-Based Access</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="font-bold text-gray-900">Partner</p>
                                    <p className="text-sm text-gray-600">Complete visibility. Manage clients, staff, audits, and firm-wide configurations.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="font-bold text-gray-900">Manager</p>
                                    <p className="text-sm text-gray-600">Supervise assigned portfolios and staff workload without modifying global settings.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="font-bold text-gray-900">Staff & Articles</p>
                                    <p className="text-sm text-gray-600">Focus on individual task queues and personal compliance deadlines.</p>
                                </div>
                            </div>
                        </div>

                        {/* Smart Automation */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Smart Automation</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center"><Compass className="w-4 h-4 mr-2 text-indigo-500" /> Auto-Task Wizard</p>
                                    <p className="text-gray-600 text-sm mt-1">Generate recurring compliance tasks (GST, TDS, IT) automatically based on client relations and frequency.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center"><Database className="w-4 h-4 mr-2 text-indigo-500" /> Bulk Import</p>
                                    <p className="text-gray-600 text-sm mt-1">Onboard your entire firm in minutes via CSV import. The system validates and populates your hub instantly.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center"><Settings className="w-4 h-4 mr-2 text-indigo-500" /> Audit Checklists</p>
                                    <p className="text-gray-600 text-sm mt-1">Detailed audit workspaces with assigned line-items provide clear responsibility and traceability.</p>
                                </div>
                            </div>
                        </div>

                        {/* Best Practices */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <HelpCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Tips & Best Practices</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Balance Workload</span> – Use the Staff Load Snapshot to reassign tasks if a team member is overloaded.</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Universal Search</span> – Quickly find any client, staff, or task using the global search bar on any page.</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Stay Updated</span> – Keep client engagement details accurate to ensure correct task generation and reporting.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent <span className="text-brand-primary">Pricing</span></h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Choose the plan that best fits your practice size and needs. No hidden fees.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Tier</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-gray-900">₹0</span>
                                <span className="text-gray-500 ml-2">/month</span>
                            </div>
                            <p className="text-gray-600 mb-8">Perfect for small firms and individual practitioners getting started.</p>

                            <ul className="space-y-4 mb-8 text-left">
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Up to 5 Users</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Up to 25 Clients</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Auto Task: Once every 3 months</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">1 Audit Creation per month</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Excel Import: Once (Lifetime)</span>
                                </li>
                            </ul>

                            <Link
                                to="/login"
                                className="block w-full text-center bg-gray-50 text-gray-900 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                Get Started Free
                            </Link>
                        </div>

                        {/* Growth Tier */}
                        <div className="bg-white rounded-3xl p-8 border-2 border-brand-primary shadow-xl relative overflow-hidden transform md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Growth Tier</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-gray-900">₹999</span>
                                <span className="text-gray-500 ml-2">/month</span>
                            </div>
                            <p className="text-gray-600 mb-8">For growing firms that need more power and fewer limits.</p>

                            <ul className="space-y-4 mb-8 text-left">
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 font-medium">Up to 25 Users</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 font-medium">Up to 150 Clients</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 font-medium">Unlimited Auto Tasks</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 font-medium">Unlimited Audit Creations</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 font-medium">Unlimited Excel Imports</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 font-medium">Additional users/clients scalable</span>
                                </li>
                            </ul>

                            <Link
                                to="/login"
                                className="block w-full text-center bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-500/30 hover:bg-orange-600 transition-all"
                            >
                                Upgrade to Growth
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact / Support Section */}
            <section className="py-16 bg-gray-50 border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Need Help or Custom Setup?</h2>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-gray-500 font-medium">Email Support</p>
                                <a href="mailto:learnwithfun116@gmail.com" className="text-lg font-bold text-gray-900 hover:text-brand-primary">learnwithfun116@gmail.com</a>
                            </div>
                        </div>
                        <div className="h-px w-full md:h-12 md:w-px bg-gray-200"></div>
                        <div className="text-left max-w-xs">
                            <p className="text-gray-600 text-sm">
                                Contact us for advanced pricing, enterprise setup, or any support queries. We're here to help!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-brand-dark text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Transform Your Practice?</h2>
                    <p className="text-xl text-gray-300 mb-12 opacity-80 leading-relaxed">
                        Join the finance professionals who have streamlined their workflow with CAControl.
                        Get started today—it's completely free to use.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-white">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto bg-brand-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all flex items-center justify-center"
                        >
                            Register for Free
                            <ArrowRight className="ml-2" />
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all text-white"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                        <div className="flex items-center mb-4 md:mb-0">
                            <CAControlLogo size="sm" showText={true} className="opacity-70 grayscale" />
                        </div>
                        <div className="flex space-x-8">
                            <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">Contact Support</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Helper Components
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
);

const BenefitItem: React.FC<{ icon: React.ReactNode; title: string, description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-brand-primary rounded-lg flex items-center justify-center mt-1">
            {icon}
        </div>
        <div className="ml-4">
            <h4 className="text-lg font-bold text-gray-900">{title}</h4>
            <p className="text-gray-600">{description}</p>
        </div>
    </div>
);

const WorkloadBar: React.FC<{ label: string; progress: number, tasks: number, color: string }> = ({ label, progress, tasks, color }) => (
    <div>
        <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">{label}</span>
            <span className="text-gray-500">{tasks} tasks</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full ${color} rounded-full transition-all duration-1000`}
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
);

export default LandingPage;
