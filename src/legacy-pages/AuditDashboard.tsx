import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditManagementService } from '../services/audit-management.service';
import { useTasksStore } from '../store/tasks.store';
import { useAuthStore } from '../store/auth.store';
import { SubscriptionService } from '../services/subscription.service';
import { AuditPlan, Task } from '../types';
import { ClipboardList, User, Calendar, ExternalLink, Plus, AlertCircle, CheckCircle2, ListTodo, Trash2, Lock } from 'lucide-react';

const AuditDashboard: React.FC = () => {
    const [audits, setAudits] = useState<AuditPlan[]>([]);
    const [potentialTasks, setPotentialTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthlyAuditCount, setMonthlyAuditCount] = useState(0);
    const navigate = useNavigate();
    const { firm } = useAuthStore();

    useEffect(() => {
        loadData();
    }, [firm]); // Reload if firm changes (e.g. upgrade)

    const loadData = async () => {
        console.log('AuditDashboard: loadData started');
        setLoading(true);
        try {
            console.log('AuditDashboard: Fetching audits and tasks...');
            const [activeAudits, pendingTasks] = await Promise.all([
                auditManagementService.getAuditPlans(),
                auditManagementService.getPotentialAuditTasks()
            ]);

            if (firm) {
                const count = await SubscriptionService.getMonthlyAuditCount(firm.id);
                setMonthlyAuditCount(count);
            }

            console.log('AuditDashboard: Fetch success', { audits: activeAudits.length, tasks: pendingTasks.length });
            setAudits(activeAudits);
            setPotentialTasks(pendingTasks);
        } catch (error) {
            console.error('Failed to load audits', error);
        } finally {
            console.log('AuditDashboard: loadData finished');
            setLoading(false);
        }
    };

    const canCreate = SubscriptionService.canCreateAudit(firm, monthlyAuditCount);

    const handleDeleteAudit = async (e: React.MouseEvent, auditId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this audit plan? This will also remove the link from the associated task.')) {
            try {
                await auditManagementService.deleteAuditPlan(auditId);
                await loadData();
            } catch (error) {
                console.error('Failed to delete audit', error);
                alert('Error deleting audit plan');
            }
        }
    };

    const handleInitialize = async (task: Task) => {
        if (!canCreate) {
            alert('Monthly audit creation limit reached. Please upgrade to Growth.');
            return;
        }

        try {
            // Fetch templates first
            const templates = await auditManagementService.getTemplates();
            let selectedTemplateId = '';

            if (templates.length > 0) {
                // For now, we'll use the Statutory Audit Master Template if found, otherwise the first one
                const statutoryTemplate = templates.find(t => t.name.includes('Statutory Audit'));
                selectedTemplateId = statutoryTemplate ? statutoryTemplate.id : templates[0].id;

                if (!window.confirm(`Found template: "${templates.find(t => t.id === selectedTemplateId)?.name}". Would you like to apply it to this new audit?`)) {
                    selectedTemplateId = ''; // User declined, create blank
                }
            }

            const newAudit = await auditManagementService.createAuditPlan({
                client_id: task.client_id,
                lead_staff_id: task.staff_id,
                title: `Audit: ${task.title}`,
                status: 'active',
                start_date: new Date().toISOString().split('T')[0]
            });

            await useTasksStore.getState().updateTask(task.id, { audit_id: newAudit.id });

            // If a template was selected, apply its items
            if (selectedTemplateId) {
                await auditManagementService.createAuditFromTemplate(selectedTemplateId, newAudit.id);
            }

            navigate(`/dashboard/audits/${newAudit.id}`);
        } catch (error) {
            console.error('Failed to initialize audit', error);
            alert('Error creating audit workspace');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Management</h1>
                    <p className="text-gray-500">Track and manage active audit plans and checklists</p>
                    {!canCreate && (
                        <p className="text-xs text-red-500 font-bold mt-1">
                            Monthly limit reached ({monthlyAuditCount}/{SubscriptionService.getLimits(firm).maxAuditsPerMonth}). Resets next month.
                        </p>
                    )}
                </div>
                <button
                    onClick={() => canCreate ? navigate('/dashboard/tasks') : null}
                    disabled={!canCreate}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-md ${canCreate
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {canCreate ? <Plus className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    New Audit Plan
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Active Audits Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-gray-900 font-bold">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <h2>Active Audit Workspaces ({audits.length})</h2>
                        </div>

                        {audits.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                <p className="text-gray-500 text-sm">No active workspaces. Initialize an audit from a task below.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {audits.map((audit) => (
                                    <div
                                        key={audit.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all cursor-pointer overflow-hidden group"
                                        onClick={() => navigate(`/dashboard/audits/${audit.id}`)}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <ClipboardList className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${audit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {audit.status.toUpperCase()}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDeleteAudit(e, audit.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Audit Plan"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                {audit.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                                                {audit.client?.name}
                                            </p>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <User className="h-4 w-4 mr-2" />
                                                    <span>{audit.lead_staff?.name || 'Unassigned'}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    <span>Started: {new Date(audit.start_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-gray-500">Progress</span>
                                                    <span className="text-blue-600">{Math.round(audit.progress)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${audit.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                            <span>Last updated {new Date(audit.updated_at).toLocaleDateString()}</span>
                                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pending Tasks Section */}
                    {potentialTasks.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center space-x-2 text-gray-900 font-bold">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                <h2>Initialize Audit from Tasks ({potentialTasks.length})</h2>
                            </div>
                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {potentialTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        {task.compliance_type?.name || 'Task'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        Due {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-1">{task.title}</h4>
                                                <p className="text-xs text-gray-500 mb-4">{task.client?.name}</p>
                                            </div>
                                            <button
                                                onClick={() => handleInitialize(task)}
                                                className="w-full flex items-center justify-center px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all text-xs font-bold"
                                            >
                                                Initialize Worksheet
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {audits.length === 0 && potentialTasks.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-20 text-center">
                            <ListTodo className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Get Started with Audits</h3>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                Create a task with "Audit" in the name or category to see it here for worksheet initialization.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard/tasks')}
                                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                Create Audit Task
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditDashboard;
