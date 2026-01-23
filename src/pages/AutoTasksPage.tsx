import * as React from 'react';
import { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { useCompliance } from '../hooks/useCompliance';
import { useTasks } from '../hooks/useTasks';
import { useAuthStore } from '../store/auth.store';
import { Task } from '../types';
import AutoTaskModal from '../components/Tasks/AutoTaskModal';
import DefineClientStaffRelation from '../components/Tasks/DefineClientStaffRelation';
import RecurringRuleModal from '../components/Tasks/RecurringRuleModal';
import { Zap, Users, FileText, CheckSquare, Calculator, PieChart, Repeat, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { recurringTasksService, RecurringTaskRule } from '../services/recurring-tasks.service';

const AutoTasksPage: React.FC = () => {
    const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);
    const [showRelationsModal, setShowRelationsModal] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [selectedComplianceCode, setSelectedComplianceCode] = useState<string | null>(null);
    const [recurringRules, setRecurringRules] = useState<RecurringTaskRule[]>([]);
    const [editingRule, setEditingRule] = useState<RecurringTaskRule | undefined>();
    const [isLoadingRules, setIsLoadingRules] = useState(false);

    const { clients } = useClients();
    const { staff } = useStaff();
    const { complianceTypes } = useCompliance();
    const { createBulkTasks } = useTasks();
    const { user } = useAuthStore();

    useEffect(() => {
        loadRecurringRules();
    }, []);

    const loadRecurringRules = async () => {
        setIsLoadingRules(true);
        try {
            const rules = await recurringTasksService.getRecurringRules();
            setRecurringRules(rules);
        } catch (error) {
            console.error('Failed to load recurring rules:', error);
        } finally {
            setIsLoadingRules(false);
        }
    };

    const handleAutoTaskGeneration = async (newTasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]) => {
        try {
            const tasksWithAssignment = newTasks.map(task => ({
                ...task,
                assigned_by: user?.id || '',
            }));
            await createBulkTasks(tasksWithAssignment);
        } catch (error) {
            console.error('Auto task generation failed:', error);
        }
    };

    const handleSaveRecurringRule = async (rule: Omit<RecurringTaskRule, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'last_generated_at'>) => {
        try {
            if (editingRule) {
                await recurringTasksService.updateRecurringRule(editingRule.id, rule);
            } else {
                await recurringTasksService.createRecurringRule(rule);
            }
            await loadRecurringRules();
            setShowRecurringModal(false);
            setEditingRule(undefined);
        } catch (error) {
            console.error('Failed to save recurring rule:', error);
            throw error;
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this recurring rule?')) return;

        try {
            await recurringTasksService.deleteRecurringRule(id);
            await loadRecurringRules();
        } catch (error) {
            console.error('Failed to delete rule:', error);
            alert('Failed to delete rule');
        }
    };

    const handleToggleRule = async (id: string, isActive: boolean) => {
        try {
            await recurringTasksService.toggleRuleStatus(id, !isActive);
            await loadRecurringRules();
        } catch (error) {
            console.error('Failed to toggle rule:', error);
        }
    };

    const handleTileClick = (code: string) => {
        setSelectedComplianceCode(code);
        setShowAutoTaskModal(true);
    };

    const handleCloseModal = () => {
        setShowAutoTaskModal(false);
        setSelectedComplianceCode(null);
    };

    const handleCloseRecurringModal = () => {
        setShowRecurringModal(false);
        setEditingRule(undefined);
    };

    // Define tiles configuration manually for now or derived from compliance types?
    // Manual for better UI/Icons mapping
    const tileConfig = [
        { code: 'GSTR-1', label: 'GSTR-1', icon: FileText, color: 'bg-orange-50 text-orange-600' },
        { code: 'GSTR-3B', label: 'GSTR-3B', icon: FileText, color: 'bg-orange-50 text-orange-600' },
        { code: 'ACCOUNTING', label: 'Accounting', icon: Calculator, color: 'bg-green-50 text-green-600' },
        { code: '24Q', label: 'TDS (24Q)', icon: PieChart, color: 'bg-blue-50 text-blue-600' },
        { code: '26Q', label: 'TDS (26Q)', icon: PieChart, color: 'bg-blue-50 text-blue-600' },
        { code: '27Q', label: 'TDS (27Q)', icon: PieChart, color: 'bg-blue-50 text-blue-600' },
        { code: 'PAYROLL', label: 'Payroll', icon: Users, color: 'bg-purple-50 text-purple-600' },
        { code: 'AUDIT', label: 'Audit', icon: CheckSquare, color: 'bg-red-50 text-red-600' },
    ];

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Auto Task Generation</h2>
                    <p className="text-gray-600 mt-1">Select a category to generating compliance tasks</p>
                </div>
                <button
                    onClick={() => setShowRelationsModal(true)}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Users className="h-4 w-4" />
                    Define Client-Staff Relations
                </button>
            </div>

            {/* Task Tiles Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {tileConfig.map(tile => (
                    <button
                        key={tile.code}
                        onClick={() => handleTileClick(tile.code)}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
                    >
                        <div className={`p-3 rounded-lg w-fit mb-4 ${tile.color} group-hover:bg-opacity-80`}>
                            <tile.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{tile.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">Generate tasks</p>
                    </button>
                ))}

                {/* Fallback/Generic Tile */}
                <button
                    onClick={() => handleTileClick('ALL')}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
                >
                    <div className="p-3 rounded-lg w-fit mb-4 bg-gray-50 text-gray-600">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Custom / All</h3>
                    <p className="text-sm text-gray-500 mt-1">Select manually</p>
                </button>
            </div>

            {/* Recurring Rules Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <Repeat className="h-6 w-6 text-purple-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Recurring Task Rules</h3>
                            <p className="text-sm text-gray-600">Auto-generate tasks on a schedule</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRecurringModal(true)}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Rule</span>
                    </button>
                </div>

                {isLoadingRules ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading rules...</p>
                    </div>
                ) : recurringRules.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <Repeat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-1">No Recurring Rules</h4>
                        <p className="text-gray-600 text-sm">Create a rule to automatically generate tasks</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recurringRules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{rule.title}</div>
                                            {rule.description && (
                                                <div className="text-xs text-gray-500">{rule.description}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {getClientName(rule.client_id)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">
                                                Day {rule.execution_day} {rule.frequency}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${rule.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {rule.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleRule(rule.id, rule.is_active)}
                                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                    title={rule.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {rule.is_active ? (
                                                        <PowerOff className="h-4 w-4 text-gray-600" />
                                                    ) : (
                                                        <Power className="h-4 w-4 text-green-600" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAutoTaskModal && (
                <AutoTaskModal
                    clients={clients}
                    staff={staff}
                    complianceTypes={complianceTypes}
                    initialComplianceCode={selectedComplianceCode}
                    onClose={handleCloseModal}
                    onGenerate={handleAutoTaskGeneration}
                />
            )}

            {showRelationsModal && (
                <DefineClientStaffRelation
                    clients={clients}
                    staff={staff}
                    onClose={() => setShowRelationsModal(false)}
                />
            )}

            {showRecurringModal && (
                <RecurringRuleModal
                    rule={editingRule}
                    clients={clients}
                    staff={staff}
                    complianceTypes={complianceTypes}
                    onClose={handleCloseRecurringModal}
                    onSave={handleSaveRecurringRule}
                />
            )}
        </div>
    );
};

export default AutoTasksPage;
