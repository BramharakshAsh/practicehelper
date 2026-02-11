import React from 'react';
import { X, Calendar, User, Building, FileText, ExternalLink, CheckSquare, Plus, Paperclip, Clock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auditManagementService } from '../../services/audit-management.service';
import { tasksService } from '../../services/tasks.service';
import { Task, Document, UserRole } from '../../types';
import TaskComments from './TaskComments';
import { useDocuments } from '../../store/documents.store';
import { useTimeEntriesStore } from '../../store/time-entries.store';
import DocumentList from '../Documents/DocumentList';
import DocumentUploadModal from '../Documents/DocumentUploadModal';

interface TaskDetailsModalProps {
    task: Task;
    onClose: () => void;
    onStatusChange: (taskId: string, status: Task['status']) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    currentRole?: UserRole;
}

const statusColors: Record<Task['status'], string> = {
    assigned: 'bg-gray-100 text-gray-800 ring-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 ring-blue-200',
    awaiting_client_data: 'bg-orange-100 text-orange-800 ring-orange-200',
    ready_for_review: 'bg-purple-100 text-purple-800 ring-purple-200',
    filed_completed: 'bg-green-100 text-green-800 ring-green-200',
    scheduled: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, onStatusChange, onUpdateTask, currentRole }) => {
    const navigate = useNavigate();
    const { documents, fetchDocuments, uploadDocument, deleteDocument } = useDocuments();
    const { startTimer, activeTimer } = useTimeEntriesStore();
    const [showUploadModal, setShowUploadModal] = React.useState(false);
    const [taskDocuments, setTaskDocuments] = React.useState<Document[]>([]);

    React.useEffect(() => {
        fetchDocuments({ taskId: task.id });
    }, [task.id, fetchDocuments]);

    React.useEffect(() => {
        setTaskDocuments(documents.filter(d => d.task_id === task.id));
    }, [documents, task.id]);

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
                                    <div className="flex items-center space-x-2">
                                        <User className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium lowercase">Assigned by</p>
                                            <p className="text-sm font-medium text-gray-600 italic">{task.creator?.full_name || 'System'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Instructions & To Remember */}
                            {(task.client?.instructions || task.client?.to_remember) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {task.client?.instructions && (
                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                            <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Instructions</h4>
                                            <p className="text-xs text-blue-900 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                                                {task.client.instructions}
                                            </p>
                                        </div>
                                    )}
                                    {task.client?.to_remember && (
                                        <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                            <h4 className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-1">To Remember</h4>
                                            <p className="text-xs text-orange-900 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                                                {task.client.to_remember}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={task.status}
                                            onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
                                            className={`rounded-lg text-sm font-medium px-3 py-1 border-0 ring-1 ring-inset focus:ring-2 focus:ring-blue-600 ${statusColors[task.status]}`}
                                        >
                                            <option value="assigned">Assigned</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="awaiting_client_data">Awaiting Data</option>
                                            <option value="ready_for_review">Ready for Review</option>
                                            {!['staff', 'paid_staff', 'articles'].includes(currentRole || '') && (
                                                <option value="filed_completed">Filed / Completed</option>
                                            )}
                                        </select>

                                        <button
                                            onClick={() => startTimer(task.id)}
                                            disabled={activeTimer.activeTaskId === task.id}
                                            className={`p-2 rounded-full transition-colors ${activeTimer.activeTaskId === task.id
                                                ? 'bg-green-100 text-green-600 cursor-default'
                                                : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                                }`}
                                            title={activeTimer.activeTaskId === task.id ? 'Timer Running' : 'Start Timer'}
                                        >
                                            {activeTimer.activeTaskId === task.id ? <Clock className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {task.status === 'filed_completed' && (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 animate-fade-in">
                                        <h4 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center">
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Filing Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-green-800 mb-1">
                                                    Reference / ARN No.
                                                </label>
                                                <input
                                                    type="text"
                                                    value={task.filing_reference || ''}
                                                    onChange={(e) => onUpdateTask?.(task.id, { filing_reference: e.target.value })}
                                                    placeholder="e.g. AA070224123456"
                                                    className="w-full text-sm border-green-200 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-green-800 mb-1">
                                                    Date of Filing
                                                </label>
                                                <input
                                                    type="date"
                                                    value={task.filing_date || ''}
                                                    onChange={(e) => onUpdateTask?.(task.id, { filing_date: e.target.value })}
                                                    className="w-full text-sm border-green-200 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

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

                                {/* Checklist Section */}
                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Checklist
                                            <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">
                                                {task.checklist?.filter(i => i.completed).length || 0}/{task.checklist?.length || 0}
                                            </span>
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const text = window.prompt('Enter checklist item:');
                                                if (text && onUpdateTask) {
                                                    const newChecklist = [...(task.checklist || []), {
                                                        id: Math.random().toString(36).substr(2, 9),
                                                        text,
                                                        completed: false
                                                    }];
                                                    onUpdateTask(task.id, { checklist: newChecklist });
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center bg-blue-50 px-2 py-1 rounded"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                        {!task.checklist || task.checklist.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic text-center py-2">No items in checklist yet</p>
                                        ) : (
                                            task.checklist.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-start p-2 rounded-lg transition-colors group ${item.completed ? 'bg-gray-50/50' : 'bg-white border border-gray-100'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={item.completed}
                                                        onChange={(e) => {
                                                            const newChecklist = task.checklist?.map(i =>
                                                                i.id === item.id ? { ...i, completed: e.target.checked } : i
                                                            );
                                                            onUpdateTask?.(task.id, { checklist: newChecklist });
                                                        }}
                                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className={`ml-3 text-sm flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                                                        }`}>
                                                        {item.text}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const newChecklist = task.checklist?.filter(i => i.id !== item.id);
                                                            onUpdateTask?.(task.id, { checklist: newChecklist });
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            Documents
                                        </h4>
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </button>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        <DocumentList documents={taskDocuments} onDelete={deleteDocument} />
                                    </div>
                                </div>

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
                </div >

                {showUploadModal && (
                    <DocumentUploadModal
                        onClose={() => setShowUploadModal(false)}
                        onUpload={uploadDocument}
                        preselectedClientId={task.client_id}
                        preselectedTaskId={task.id}
                    />
                )}

            </div >
        </div >
    );
};

export default TaskDetailsModal;
