import * as React from 'react';
import { useState } from 'react';
import { Upload, Lock } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { useTasks } from '../hooks/useTasks';
import { useCompliance } from '../hooks/useCompliance';
import { useAuthStore } from '../store/auth.store';
import ImportModal from '../components/Import/ImportModal';
import { SubscriptionService } from '../services/subscription.service';

const ImportPage: React.FC = () => {
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState<'clients' | 'staff' | 'tasks'>('clients');

    const { clients, importClients } = useClients();
    const { staff, importStaff } = useStaff();
    const { importTasks } = useTasks();
    const { complianceTypes } = useCompliance();
    const { user, firm, setFirm } = useAuthStore();

    const canImport = SubscriptionService.canImportExcel(firm);

    const handleImport = async (type: 'clients' | 'staff' | 'tasks', data: any[]) => {
        console.log(`[Import] Starting import for ${type}, ${data.length} records`);
        let successCount = 0;
        const errors: string[] = [];

        try {
            switch (type) {
                case 'clients':
                    console.log('[Import] Importing clients...', data);
                    // Check limit
                    if (!SubscriptionService.canAddClient(firm, clients.length, data.length)) {
                        alert(`Cannot import ${data.length} clients. Limit will be exceeded.\nCurrent: ${clients.length}\nImport: ${data.length}\nLimit: ${SubscriptionService.getLimits(firm).maxClients}`);
                        return;
                    }

                    const clientResult = await importClients(data) as any;
                    successCount = clientResult.success;
                    console.log(`[Import] Import completed: ${clientResult.success} success, ${clientResult.failures} failures`);
                    if (clientResult.failures > 0) {
                        alert(`⚠️ Imported ${clientResult.success} client(s) with ${clientResult.failures} failure(s):\n${clientResult.errors.slice(0, 3).join('\n')}${clientResult.errors.length > 3 ? '\n...' : ''}`);
                    } else {
                        alert(`✅ Successfully imported ${clientResult.success} client${clientResult.success !== 1 ? 's' : ''}!`);
                    }
                    break;
                case 'staff':
                    console.log('[Import] Importing staff...', data);
                    // Check limit
                    if (!SubscriptionService.canAddUser(firm, staff.length, data.length)) {
                        alert(`Cannot import ${data.length} staff members. Limit will be exceeded.\nCurrent: ${staff.length}\nImport: ${data.length}\nLimit: ${SubscriptionService.getLimits(firm).maxUsers}`);
                        return;
                    }

                    const staffResult = await importStaff(data) as any;
                    successCount = staffResult.success;
                    console.log(`[Import] Import completed: ${staffResult.success} success, ${staffResult.failures} failures`);
                    if (staffResult.failures > 0) {
                        const errorList = staffResult.errors.map((e: any) => typeof e === 'string' ? e : e?.message || JSON.stringify(e));
                        alert(`⚠️ Imported ${staffResult.success} staff with ${staffResult.failures} failure(s):\n\n${errorList.slice(0, 5).join('\n')}${errorList.length > 5 ? '\n...' : ''}`);
                    } else {
                        alert(`✅ Successfully imported ${staffResult.success} staff member${staffResult.success !== 1 ? 's' : ''}!`);
                    }
                    break;
                case 'tasks': {
                    console.log('[Import] Processing task data...');
                    // Process task data to match client and staff
                    const processedTasks = data.map(item => {
                        const client = clients.find(c => c.name === item.client_name);
                        const staffMember = staff.find(s => s.name === item.staff_name);
                        const complianceType = complianceTypes.find(ct => ct.name === item.compliance_type);

                        if (!client) {
                            errors.push(`Client "${item.client_name}" not found for task "${item.title}"`);
                        }
                        if (!staffMember) {
                            errors.push(`Staff "${item.staff_name}" not found for task "${item.title}"`);
                        }

                        return {
                            ...item,
                            client_id: client?.id || '',
                            staff_id: staffMember?.id || '',
                            compliance_type_id: complianceType?.id || '',
                            status: 'assigned' as const,
                            assigned_by: user?.id || '',
                        };
                    });

                    console.log('[Import] Importing tasks...', processedTasks);
                    await importTasks(processedTasks);
                    successCount = processedTasks.length;

                    if (errors.length > 0) {
                        console.warn('[Import] Warnings:', errors);
                        alert(`⚠️ Imported ${successCount} tasks with ${errors.length} warning(s):\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
                    } else {
                        console.log(`[Import] Successfully imported ${successCount} tasks`);
                        alert(`✅ Successfully imported ${successCount} task${successCount !== 1 ? 's' : ''}!`);
                    }
                    break;
                }
            }

            // Increment usage if successful
            if (successCount > 0 && firm) {
                await SubscriptionService.incrementExcelImportUsage(firm.id);
                // Ideally refresh firm to reflect new count
                // const updatedFirm = await authService.getFirm(firm.id);
                // setFirm(updatedFirm);
            }

        } catch (error) {
            console.error('[Import] Import failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`❌ Import failed: ${errorMessage}`);
            // Error handling is done in the hooks/stores
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Import Data</h2>
                    <p className="text-sm text-gray-600 mt-1">Import clients, staff, and tasks from Excel/CSV files</p>
                </div>
                {!canImport && (
                    <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Import Limit Reached
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Upgrade or contact support</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { type: 'clients' as const, title: 'Import Clients', desc: 'Upload client master data' },
                    { type: 'staff' as const, title: 'Import Staff', desc: 'Upload staff/team members' },
                    { type: 'tasks' as const, title: 'Import Tasks', desc: 'Upload task assignments' }
                ].map(item => (
                    <button
                        key={item.type}
                        onClick={() => {
                            if (canImport) {
                                setImportType(item.type);
                                setShowImportModal(true);
                            } else {
                                alert('Excel Import limit reached for Free Tier. Please upgrade.');
                            }
                        }}
                        disabled={!canImport}
                        className={`p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left ${!canImport ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            {canImport ? <Upload className="h-6 w-6 text-blue-600" /> : <Lock className="h-6 w-6 text-gray-400" />}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                    </button>
                ))}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <ImportModal
                    type={importType}
                    onClose={() => setShowImportModal(false)}
                    onImport={(data: any[]) => {
                        handleImport(importType, data);
                        setShowImportModal(false);
                    }}
                />
            )}
        </div>
    );
}

export default ImportPage;
