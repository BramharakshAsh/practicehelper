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
import { Zap, Users, FileText, CheckSquare, BarChart, Calculator, Briefcase, PieChart } from 'lucide-react';

const AutoTasksPage: React.FC = () => {
    const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);
    const [showRelationsModal, setShowRelationsModal] = useState(false);
    const [selectedComplianceCode, setSelectedComplianceCode] = useState<string | null>(null);

    const { clients } = useClients();
    const { staff } = useStaff();
    const { complianceTypes } = useCompliance();
    const { createBulkTasks } = useTasks();
    const { user } = useAuthStore();

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

    const handleTileClick = (code: string) => {
        setSelectedComplianceCode(code);
        setShowAutoTaskModal(true);
    };

    const handleCloseModal = () => {
        setShowAutoTaskModal(false);
        setSelectedComplianceCode(null);
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

    return (
        <div className="space-y-6">
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
        </div>
    );
};

export default AutoTasksPage;
