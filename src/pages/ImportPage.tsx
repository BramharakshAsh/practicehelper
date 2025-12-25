import * as React from 'react';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { useTasks } from '../hooks/useTasks';
import { useCompliance } from '../hooks/useCompliance';
import { useAuthStore } from '../store/auth.store';
import ImportModal from '../components/Import/ImportModal';

const ImportPage: React.FC = () => {
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState<'clients' | 'staff' | 'tasks'>('clients');

    const { clients, importClients } = useClients();
    const { staff, importStaff } = useStaff();
    const { importTasks } = useTasks();
    const { complianceTypes } = useCompliance();
    const { user } = useAuthStore();

    const handleImport = async (type: 'clients' | 'staff' | 'tasks', data: any[]) => {
        try {
            switch (type) {
                case 'clients':
                    await importClients(data);
                    break;
                case 'staff':
                    await importStaff(data);
                    break;
                case 'tasks':
                    // Process task data to match client and staff
                    const processedTasks = data.map(item => {
                        const client = clients.find(c => c.name === item.client_name);
                        const staffMember = staff.find(s => s.name === item.staff_name);
                        const complianceType = complianceTypes.find(ct => ct.name === item.compliance_type);

                        return {
                            ...item,
                            client_id: client?.id || '',
                            staff_id: staffMember?.id || '',
                            compliance_type_id: complianceType?.id || '',
                            status: 'assigned' as const,
                            assigned_by: user?.id || '',
                        };
                    });
                    await importTasks(processedTasks);
                    break;
            }
        } catch (error) {
            console.error('Import failed:', error);
            // Error handling is done in the hooks/stores
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Import Data</h2>
                <p className="text-gray-600 mt-1">Import clients, staff, and tasks from Excel/CSV files</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { type: 'clients' as const, title: 'Import Clients', desc: 'Upload client master data' },
                    { type: 'staff' as const, title: 'Import Staff', desc: 'Upload staff member data' },
                    { type: 'tasks' as const, title: 'Import Tasks', desc: 'Upload task assignments' }
                ].map(item => (
                    <button
                        key={item.type}
                        onClick={() => { setImportType(item.type); setShowImportModal(true); }}
                        className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Upload className="h-6 w-6 text-blue-600" />
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
