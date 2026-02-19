import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auditManagementService } from '../services/audit-management.service';
import { staffService } from '../services/staff.service';
import { AuditPlan, AuditChecklistItem, Staff } from '../types';
import {
    ChevronRight, ChevronDown, Plus, Trash2, CheckCircle2,
    Circle, User, Calendar as CalendarIcon, ArrowLeft,
    ListTodo
} from 'lucide-react';

const AuditWorkspace: React.FC = () => {
    const { auditId: id } = useParams<{ auditId: string }>();
    const navigate = useNavigate();
    const [audit, setAudit] = useState<AuditPlan | null>(null);
    const [checklist, setChecklist] = useState<AuditChecklistItem[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (auditId: string) => {
        try {
            const [auditData, checklistData, staffData] = await Promise.all([
                auditManagementService.getAuditPlan(auditId),
                auditManagementService.getAuditChecklist(auditId),
                staffService.getStaff()
            ]);
            setAudit(auditData);
            setChecklist(checklistData);
            setStaffList(staffData);

            // Expand all nodes initially for better UX
            const allIds = new Set<string>();
            const collectIds = (items: AuditChecklistItem[]) => {
                items.forEach(item => {
                    if (item.children && item.children.length > 0) {
                        allIds.add(item.id);
                        collectIds(item.children);
                    }
                });
            };
            collectIds(checklistData);
            setExpanded(allIds);
        } catch (error) {
            console.error('Failed to load audit data', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (itemId: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const toggleComplete = async (item: AuditChecklistItem) => {
        if (item.children && item.children.length > 0) return;

        try {
            await auditManagementService.updateChecklistItem(item.id, { is_completed: !item.is_completed });
            if (id) loadData(id);
        } catch (error) {
            console.error('Failed to update item', error);
        }
    };

    const updateItem = async (itemId: string, updates: Partial<AuditChecklistItem>) => {
        try {
            await auditManagementService.updateChecklistItem(itemId, updates);
            if (id) loadData(id);
        } catch (error) {
            console.error('Failed to update item', error);
        }
    };

    const addItem = async (parentId?: string) => {
        if (!id) return;
        try {
            const title = prompt('Enter item name:') || 'New Item';
            await auditManagementService.createChecklistItem({
                audit_id: id,
                parent_id: parentId,
                title,
                is_completed: false,
                order_index: 0
            });
            loadData(id);
        } catch (error) {
            console.error('Failed to add item', error);
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item? Sub-items will also be deleted.')) return;
        try {
            await auditManagementService.deleteChecklistItem(itemId);
            if (id) loadData(id);
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    const ChecklistNode: React.FC<{ item: AuditChecklistItem, depth: number }> = ({ item, depth }) => {
        const isExpanded = expanded.has(item.id);
        const hasChildren = item.children && item.children.length > 0;

        // Calculate progress for groups locally for UI feedback
        const getGroupProgress = (node: AuditChecklistItem): number => {
            if (!node.children || node.children.length === 0) return node.is_completed ? 100 : 0;
            const total = node.children.length;
            const completed = node.children.filter(c => getGroupProgress(c) === 100).length;
            return (completed / total) * 100;
        };

        const progress = hasChildren ? getGroupProgress(item) : (item.is_completed ? 100 : 0);

        return (
            <div className="select-none">
                <div
                    className={`group flex items-center py-2 px-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${depth === 0 ? 'bg-white font-semibold' : 'text-sm'
                        }`}
                    style={{ paddingLeft: `${(depth + 1) * 20}px` }}
                >
                    <div className="flex items-center flex-1 min-w-0">
                        <button
                            onClick={() => toggleExpand(item.id)}
                            className={`p-1 mr-1 rounded hover:bg-gray-200 transition-colors ${!hasChildren ? 'invisible' : ''}`}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        <button
                            onClick={() => toggleComplete(item)}
                            className={`p-1 mr-3 rounded-full transition-colors ${hasChildren
                                ? 'cursor-default opacity-50'
                                : 'hover:bg-blue-50 text-blue-600'
                                }`}
                            disabled={hasChildren}
                        >
                            {item.is_completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Circle className="h-5 w-5 text-gray-300" />
                            )}
                        </button>

                        <div className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className={`${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {item.title}
                            </span>
                            {hasChildren && (
                                <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                    {Math.round(progress)}%
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!hasChildren && (
                            <>
                                <select
                                    className="text-[10px] border-none bg-gray-50 rounded px-1 py-1 focus:ring-1 focus:ring-blue-500"
                                    value={item.assigned_to || ''}
                                    onChange={(e) => updateItem(item.id, { assigned_to: e.target.value })}
                                >
                                    <option value="">Assign Staff</option>
                                    {staffList.map(s => <option key={s.id} value={s.user_id}>{s.name}</option>)}
                                </select>
                                <input
                                    type="date"
                                    className="text-[10px] border-none bg-gray-50 rounded px-1 py-1 focus:ring-1 focus:ring-blue-500"
                                    value={item.target_date || ''}
                                    onChange={(e) => updateItem(item.id, { target_date: e.target.value })}
                                />
                            </>
                        )}
                        <button
                            onClick={() => addItem(item.id)}
                            className="p-1 px-2 text-xs text-blue-600 hover:bg-blue-50 rounded flex items-center"
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add
                        </button>
                        <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Static info when not hovering */}
                    {!hasChildren && (
                        <div className="flex items-center space-x-2 group-hover:hidden transition-transform">
                            {item.assigned_staff && (
                                <div className="flex items-center text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    <User className="h-3 w-3 mr-1" />
                                    <span>{item.assigned_staff.name}</span>
                                </div>
                            )}
                            {item.target_date && (
                                <div className="flex items-center text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    <span>{item.target_date}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isExpanded && hasChildren && (
                    <div className="transition-all animate-in fade-in slide-in-from-top-1 duration-200">
                        {item.children!.map(child => (
                            <ChecklistNode key={child.id} item={child} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const handleSaveAsTemplate = async () => {
        if (!id || !audit) return;

        const name = prompt('Enter a name for this template:', `Template from ${audit.title}`);
        if (!name) return;

        const description = prompt('Enter a description (optional):', `Created from audit ${audit.client?.name} on ${new Date().toLocaleDateString()}`);

        try {
            setLoading(true); // Re-use loading state or add a specific one
            await auditManagementService.createTemplateFromAudit(id, name, description || '');
            alert('Template saved successfully!');
        } catch (error) {
            console.error('Failed to save template', error);
            alert('Error saving template');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading Audit Workspace...</div>;
    if (!audit) return <div className="p-12 text-center text-red-500">Audit not found.</div>;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Workspace Header */}
            <div className="bg-white border-b border-gray-200 p-4 px-6 flex justify-between items-center z-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/dashboard/audits')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="border-l border-gray-200 pl-4">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{audit.title}</h1>
                        <div className="flex items-center text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">
                            <span className="text-blue-600 mr-2">{audit.client?.name}</span>
                            <span className="mx-2">•</span>
                            <span>Lead: {audit.lead_staff?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center mb-1.5">
                            <span className="text-xs font-bold text-gray-900 mr-2">Overall Progress</span>
                            <span className="text-sm font-black text-blue-600">{Math.round(audit.progress)}%</span>
                        </div>
                        <div className="w-48 bg-gray-100 h-1.5 rounded-full overflow-hidden border border-gray-100">
                            <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${audit.progress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSaveAsTemplate}
                            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-bold shadow-sm"
                        >
                            <ListTodo className="h-4 w-4 mr-2" />
                            Save as Template
                        </button>
                        <button
                            onClick={() => addItem()}
                            className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Root Section
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Checklist Editor */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
                {checklist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12">
                        <div className="bg-white p-6 rounded-2xl shadow-sm mb-4">
                            <ListTodo className="h-16 w-16 opacity-20 text-blue-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-900">Your audit checklist is empty</p>
                        <p className="text-sm text-gray-500 mt-1">Start by creating your first section or group.</p>
                        <button
                            onClick={() => addItem()}
                            className="mt-6 px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 font-bold transition-all"
                        >
                            Initialize Worksheet
                        </button>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto py-8 px-4">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden min-h-[500px]">
                            <div className="bg-gray-50/50 border-b border-gray-100 p-4 px-6 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                <span>Worksheet Structure</span>
                                <div className="flex space-x-8">
                                    <span>Assignee</span>
                                    <span>Target</span>
                                    <span>Actions</span>
                                </div>
                            </div>
                            {checklist.map(item => (
                                <ChecklistNode key={item.id} item={item} depth={0} />
                            ))}
                            <div
                                className="p-4 flex justify-center border-t border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                                onClick={() => addItem()}
                            >
                                <Plus className="h-5 w-5 text-gray-300" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="bg-white border-t border-gray-100 p-3 px-6 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <div className="flex space-x-12">
                    <span className="flex items-center"><Circle className="h-3 w-3 mr-2 bg-gray-200 rounded-full" /> Pending Task</span>
                    <span className="flex items-center"><CheckCircle2 className="h-3 w-3 mr-2 text-green-500" /> Validation Complete</span>
                    <span className="flex items-center"><ListTodo className="h-3 w-3 mr-2 text-blue-500" /> Status Roll-up Enabled</span>
                </div>
                <div className="flex items-center">
                    <span className="mr-4">Workspace ID: {id?.slice(0, 8)}</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-2"></div>
                    <span className="text-green-600">Sync Live</span>
                </div>
            </div>
        </div>
    );
};

export default AuditWorkspace;
