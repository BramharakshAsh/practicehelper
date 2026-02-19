import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditManagementService } from '../services/audit-management.service';
import { useTasksStore } from '../store/tasks.store';
import { useAuthStore } from '../store/auth.store';
import { SubscriptionService } from '../services/subscription.service';
import { AuditPlan, Task } from '../types';
import { ClipboardList, User, Calendar, ExternalLink, Plus, AlertCircle, CheckCircle2, ListTodo, Trash2, Lock } from 'lucide-react';

const AuditDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { firm } = useAuthStore();

    const [audits, setAudits] = useState<AuditPlan[]>([]);
    const [potentialTasks, setPotentialTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthlyAuditCount, setMonthlyAuditCount] = useState(0);

    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [firm]); // Reload if firm changes (e.g. upgrade)

    const loadData = async () => {
        console.log('AuditDashboard: loadData started');
        setLoading(true);
        try {
            console.log('AuditDashboard: Fetching audits and tasks...');
            const [activeAudits, pendingTasks, fetchedTemplates] = await Promise.all([
                auditManagementService.getAuditPlans(),
                auditManagementService.getPotentialAuditTasks(),
                auditManagementService.getTemplates()
            ]);

            if (firm) {
                const count = await SubscriptionService.getMonthlyAuditCount(firm.id);
                setMonthlyAuditCount(count);
            }

            console.log('AuditDashboard: Fetch success', { audits: activeAudits.length, tasks: pendingTasks.length });
            setAudits(activeAudits);
            setPotentialTasks(pendingTasks);
            setTemplates(fetchedTemplates);
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

    const initiateInitialize = (task: Task) => {
        if (!canCreate) {
            alert('Monthly audit creation limit reached. Please upgrade to Growth.');
            return;
        }
        setSelectedTask(task);
        setShowTemplateModal(true);
    };

    const handleConfirmInitialize = async (templateId: string | null) => {
        if (!selectedTask) return;

        try {
            setLoading(true);
            const newAudit = await auditManagementService.createAuditPlan({
                client_id: selectedTask.client_id,
                lead_staff_id: selectedTask.staff_id,
                title: `Audit: ${selectedTask.title}`,
                status: 'active',
                start_date: new Date().toISOString().split('T')[0]
            });

            await useTasksStore.getState().updateTask(selectedTask.id, { audit_id: newAudit.id });

            // If a template was selected, apply its items
            if (templateId) {
                await auditManagementService.createAuditFromTemplate(templateId, newAudit.id);
            }

            navigate(`/dashboard/audits/${newAudit.id}`);
        } catch (error) {
            console.error('Failed to initialize audit', error);
            alert('Error creating audit workspace');
        } finally {
            setLoading(false);
            setShowTemplateModal(false);
            setSelectedTask(null);
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* Template Selection Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Select Audit Template</h3>
                            <p className="text-sm text-gray-500 mt-1">Choose a template to structure your new audit workspace.</p>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                    <p className="text-gray-500 font-medium">Creating Audit Workspace...</p>
                                    <p className="text-xs text-gray-400 mt-1">This may take a few moments for large templates.</p>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleConfirmInitialize(null)}
                                        className="w-full text-left p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <div className="font-bold text-gray-700 group-hover:text-blue-700">Continue without Template</div>
                                        <div className="text-xs text-gray-500 mt-1">Start with an empty workspace</div>
                                    </button>

                                    {templates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleConfirmInitialize(t.id)}
                                            className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group bg-white"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-blue-600">{t.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description || 'No description'}</div>
                                                </div>
                                                {t.firm_id === null && (
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">SYSTEM</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                                onClick={() => initiateInitialize(task)}
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
