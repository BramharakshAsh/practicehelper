import * as React from 'react';
import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { useCompliance } from '../hooks/useCompliance';
import { useTasks } from '../hooks/useTasks';
import { useAuthStore } from '../store/auth.store';
import { Task } from '../types';
import AutoTaskModal from '../components/Tasks/AutoTaskModal';
import DefineClientStaffRelation from '../components/Tasks/DefineClientStaffRelation';
import { Zap, Users, FileText, CheckSquare, PieChart, Building } from 'lucide-react';
import { SubscriptionService } from '../services/subscription.service';
import { RecurringTaskRule } from '../services/recurring-tasks.service';

const AutoTasksPage: React.FC = () => {
    const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);
    const [showRelationsModal, setShowRelationsModal] = useState(false);
    const [selectedComplianceCode, setSelectedComplianceCode] = useState<string | null>(null);
    const [editingRule, setEditingRule] = useState<RecurringTaskRule | undefined>();

    const { clients } = useClients();
    const { staff } = useStaff();
    const { complianceTypes } = useCompliance();
    const { createBulkTasks } = useTasks();
    const { user, firm } = useAuthStore();

    const { allowed: canRunAuto, nextRunDate } = SubscriptionService.canRunAutoTasks(firm);



    const handleAutoTaskGeneration = async (newTasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]) => {
        try {
            const tasksWithAssignment = newTasks.map(task => ({
                ...task,
                assigned_by: user?.id || '',
            }));
            await createBulkTasks(tasksWithAssignment);

            // Update last run time if firm exists
            if (firm?.id) {
                await SubscriptionService.updateLastAutoTaskRun(firm.id);
                // Force a reload or just let next render handle it?
                // Ideally reload firm to update 'canRunAuto' derived state which depends on firm object
                // But for now, a page reload or refetch logic might be needed.
                // Or better: update the firm in store.
                // We don't have a direct 'refetchFirm' exposed easily here from store hooks often, 
                // but checking auth store... 
                // Actually, we can reload window or just alert success.
            }
        } catch (error) {
            // Error logged by service/store
        }
    };

    // ... existing handlers ...



    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleTileClick = (code: string) => {
        if (!canRunAuto) {
            alert(`Auto task generation is limited. Next run available on ${nextRunDate?.toLocaleDateString()}.\n\nUpgrade to Growth for unlimited runs.`);
            return;
        }

        const isCategory = dynamicCategories.includes(code);
        if (isCategory) {
            setSelectedCategory(code);
        } else {
            setSelectedComplianceCode(code);
            setShowAutoTaskModal(true);
        }
    };

    const handleSubComplianceClick = (code: string) => {
        setSelectedComplianceCode(code);
        setShowAutoTaskModal(true);
    };

    const handleCloseModal = () => {
        setShowAutoTaskModal(false);
        setSelectedComplianceCode(null);
    };

    // Map common categories to icons and colors
    const categoryStyles: Record<string, { icon: any, color: string }> = {
        'GST': { icon: FileText, color: 'bg-orange-50 text-orange-600' },
        'TDS': { icon: PieChart, color: 'bg-blue-50 text-blue-600' },
        'Income Tax': { icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
        'Audit': { icon: CheckSquare, color: 'bg-red-50 text-red-600' },
        'ROC': { icon: Building, color: 'bg-purple-50 text-purple-600' },
        'Payroll': { icon: Users, color: 'bg-green-50 text-green-600' },
        'Others': { icon: Zap, color: 'bg-gray-50 text-gray-600' },
    };

    // Derived unique categories from compliance types
    const dynamicCategories = Array.from(new Set(complianceTypes.map(ct => ct.category || 'Others'))).sort();

    const tileConfig = dynamicCategories.map(cat => ({
        code: cat,
        label: cat,
        icon: categoryStyles[cat]?.icon || Zap,
        color: categoryStyles[cat]?.color || 'bg-gray-50 text-gray-600',
        isCategory: true
    }));

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Auto Task Generation</h2>
                    <p className="text-gray-600 mt-1">Select a category to generating compliance tasks</p>
                    {!canRunAuto && (
                        <p className="text-xs text-red-500 font-bold mt-1">
                            Run limit reached. Next run available: {nextRunDate?.toLocaleDateString()}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {selectedCategory && (
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Back to Categories
                        </button>
                    )}
                    <button
                        onClick={() => setShowRelationsModal(true)}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Users className="h-4 w-4" />
                        Define Client-Staff Relations
                    </button>
                </div>
            </div>

            {/* Sub-compliance Selection for Category */}
            {selectedCategory && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {categoryStyles[selectedCategory]?.icon && React.createElement(categoryStyles[selectedCategory].icon, { className: "h-5 w-5 text-blue-600" })}
                        Select Sub Compliance for {selectedCategory}
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {complianceTypes
                            .filter(ct => ct.category === selectedCategory)
                            .map(ct => (
                                <button
                                    key={ct.id}
                                    onClick={() => handleSubComplianceClick(ct.code)}
                                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
                                >
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{ct.name}</div>
                                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{ct.code}</div>
                                    <div className="text-[10px] text-blue-600 font-medium mt-2">{ct.frequency}</div>
                                </button>
                            ))}
                        {/* Option to generate all for this category */}
                        <button
                            onClick={() => handleSubComplianceClick(selectedCategory)}
                            className="p-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all text-left flex flex-col justify-center"
                        >
                            <div className="text-sm font-bold">Generate All</div>
                            <div className="text-[10px] opacity-80">All {selectedCategory} forms</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Task Tiles Grid */}
            {!selectedCategory && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {tileConfig.map(tile => (
                        <button
                            key={tile.code}
                            onClick={() => handleTileClick(tile.code)}
                            disabled={!canRunAuto}
                            className={`p-6 rounded-xl border border-gray-200 shadow-sm text-left group transition-all ${canRunAuto
                                ? 'bg-white hover:shadow-md hover:scale-[1.02] cursor-pointer'
                                : 'bg-gray-50 opacity-60 cursor-not-allowed'
                                }`}
                        >
                            <div className={`p-3 rounded-lg w-fit mb-4 ${canRunAuto ? tile.color : 'bg-gray-200 text-gray-400'} group-hover:bg-opacity-80`}>
                                <tile.icon className="h-6 w-6" />
                            </div>
                            <h3 className={`text-lg font-semibold ${canRunAuto ? 'text-gray-900' : 'text-gray-500'}`}>{tile.label}</h3>
                            <p className="text-sm text-gray-500 mt-1">Generate tasks</p>
                        </button>
                    ))}

                    {/* Fallback/Generic Tile */}
                    <button
                        onClick={() => handleTileClick('ALL')}
                        disabled={!canRunAuto}
                        className={`p-6 rounded-xl border border-gray-200 shadow-sm text-left group transition-all ${canRunAuto
                            ? 'bg-white hover:shadow-md hover:scale-[1.02] cursor-pointer'
                            : 'bg-gray-50 opacity-60 cursor-not-allowed'
                            }`}
                    >
                        <div className={`p-3 rounded-lg w-fit mb-4 ${canRunAuto ? 'bg-gray-50 text-gray-600' : 'bg-gray-200 text-gray-400'}`}>
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className={`text-lg font-semibold ${canRunAuto ? 'text-gray-900' : 'text-gray-500'}`}>Custom / All</h3>
                        <p className="text-sm text-gray-500 mt-1">Select manually</p>
                    </button>
                </div>
            )}

            {/* Recurring Rules Section - Hidden for now
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
            */}

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

            {/* Recurring Modal - Hidden for now
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
            */}
        </div>
    );
};

export default AutoTasksPage;
