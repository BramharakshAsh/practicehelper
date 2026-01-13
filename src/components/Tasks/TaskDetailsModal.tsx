import { X, Calendar, User, Building, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auditManagementService } from '../../services/audit-management.service';
import { tasksService } from '../../services/tasks.service';
import { Task } from '../../types';
import TaskComments from './TaskComments';

interface TaskDetailsModalProps {
    task: Task;
    onClose: () => void;
    onStatusChange: (taskId: string, status: Task['status']) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, onStatusChange, onUpdateTask }) => {
    const navigate = useNavigate();

    const handleOpenAudit = async () => {
        if (task.audit_id) {
            navigate(`/dashboard/audits/${task.audit_id}`);
            onClose();
        } else {
            if (window.confirm('Initialize a dedicated Audit Workspace for this task?')) {
                try {
                    // Fetch templates first
                    const templates = await auditManagementService.getTemplates();
                    let selectedTemplateId = '';

                    if (templates.length > 0) {
                        const statutoryTemplate = templates.find(t => t.name.includes('Statutory Audit'));
                        selectedTemplateId = statutoryTemplate ? statutoryTemplate.id : templates[0].id;

                        if (!window.confirm(`Found template: "${templates.find(t => t.id === selectedTemplateId)?.name}". Would you like to apply it to the new audit?`)) {
                            selectedTemplateId = '';
                        }
                    }

                    const newAudit = await auditManagementService.createAuditPlan({
                        client_id: task.client_id,
                        lead_staff_id: task.staff_id,
                        title: `Audit: ${task.title}`,
                        status: 'active',
                        start_date: new Date().toISOString().split('T')[0]
                    });

                    if (onUpdateTask) {
                        await onUpdateTask(task.id, { audit_id: newAudit.id });
                    } else {
                        await tasksService.updateTask(task.id, { audit_id: newAudit.id });
                    }

                    if (selectedTemplateId) {
                        await auditManagementService.createAuditFromTemplate(selectedTemplateId, newAudit.id);
                    }

                    navigate(`/dashboard/audits/${newAudit.id}`);
                    onClose();
                } catch (error) {
                    console.error('Failed to initialize audit', error);
                    alert('Error creating audit workspace');
                }
            }
        }
    };
    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'text-red-700 bg-red-100';
            case 'medium': return 'text-yellow-700 bg-yellow-100';
            case 'low': return 'text-green-700 bg-green-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                        <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                                Created: {formatDate(task.created_at)}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                        {/* Left Column: Task Info */}
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Building className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-xs text-blue-500 font-medium">CLIENT</p>
                                            <p className="text-sm font-semibold text-gray-900">{task.client?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-xs text-blue-500 font-medium">ASSIGNED TO</p>
                                            <p className="text-sm font-semibold text-gray-900">{task.staff?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                                    <select
                                        value={task.status}
                                        onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
                                        className="w-full md:w-auto border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="assigned">Assigned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="awaiting_client_data">Awaiting Client Data</option>
                                        <option value="ready_for_review">Ready for Review</option>
                                        <option value="filed_completed">Filed & Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Details</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center text-sm text-gray-700">
                                            <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                                            <span className="font-medium mr-2">Due Date:</span>
                                            {formatDate(task.due_date)}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <FileText className="h-4 w-4 mr-3 text-gray-400" />
                                            <span className="font-medium mr-2">Period:</span>
                                            {task.period || 'N/A'}
                                        </div>
                                        {task.description && (
                                            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100">
                                                {task.description}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {task.remarks && (
                                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                        <h4 className="text-xs font-bold text-yellow-700 uppercase mb-1">Important Remarks</h4>
                                        <p className="text-sm text-yellow-800">{task.remarks}</p>
                                    </div>
                                )}

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleOpenAudit}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-indigo-100 shadow-lg active:scale-[0.98]"
                                    >
                                        <ExternalLink className="h-5 w-5 mr-2" />
                                        {task.audit_id ? 'Open Audit Workspace' : 'Initialize Audit Workspace'}
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-widest font-bold">
                                        Hierarchical Checklist & Staff Assignment
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Comments */}
                        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col h-[500px]">
                            <TaskComments taskId={task.id} />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskDetailsModal;
