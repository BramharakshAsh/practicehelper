import React, { useState, useEffect } from 'react';
import { X, User, Save, RotateCcw } from 'lucide-react';
import { Client, Staff, ClientStaffRelation } from '../../types';
import { clientsService } from '../../services/clients.service';

interface DefineClientStaffRelationProps {
    clients: Client[];
    staff: Staff[];
    onClose: () => void;
}

const DefineClientStaffRelation: React.FC<DefineClientStaffRelationProps> = ({ clients, staff, onClose }) => {
    const [relations, setRelations] = useState<ClientStaffRelation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // clientId being saved

    useEffect(() => {
        loadRelations();
    }, []);

    const loadRelations = async () => {
        try {
            const data = await clientsService.getClientStaffRelations();
            setRelations(data);
        } catch (error) {
            console.error('Failed to load relations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (clientId: string, staffId: string) => {
        setSaving(clientId);
        try {
            await clientsService.saveClientStaffRelation(clientId, staffId);
            // Refresh to get the new ID / confirm linkage
            await loadRelations();
        } catch (error) {
            console.error('Failed to save relation', error);
        } finally {
            setSaving(null);
        }
    };

    const getAssignedStaffId = (clientId: string) => {
        const relation = relations.find(r => r.client_id === clientId);
        return relation ? relation.staff_id : '';
    };

    // Filter only active staff
    const activeStaff = staff.filter(s => s.is_active);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <User className="h-6 w-6 text-blue-600" />
                            Define Client-Staff Relations
                        </h2>
                        <p className="text-sm text-gray-500">Set default staff assignments for auto-generated tasks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Client Name</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Work Types</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Default Staff</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {clients.map(client => {
                                    const currentStaffId = getAssignedStaffId(client.id);
                                    const isSaving = saving === client.id;

                                    return (
                                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {client.work_types.map(wt => (
                                                        <span key={wt} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                                            {wt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={currentStaffId}
                                                    onChange={(e) => handleAssign(client.id, e.target.value)}
                                                    disabled={isSaving}
                                                    className="w-full max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                >
                                                    <option value="">-- Random Assignment --</option>
                                                    {activeStaff.map(s => (
                                                        <option key={s.id} value={s.user_id}>
                                                            {s.name} ({s.role})
                                                        </option>
                                                    ))}
                                                </select>
                                                {/* Note: using s.user_id as the stored ID because relations typically link to user_id in 'staff_id' column or 'staff' table ID? 
                                                    Schema says: staff_id uuid NOT NULL REFERENCES users(id). 
                                                    Wait, the staff TABLE has its own ID. But the relations table references users(id).
                                                    Let's check schema again.
                                                    Line 202: staff_id uuid NOT NULL REFERENCES users(id).
                                                    And 'Staff' interface has 'id' (staff table uuid) and 'user_id' (users table uuid).
                                                    So I should store s.user_id. 
                                                */}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isSaving ? (
                                                    <span className="text-xs text-blue-600 animate-pulse">Saving...</span>
                                                ) : currentStaffId ? (
                                                    <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                                                        <Save className="h-3 w-3" /> Saved
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Auto</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DefineClientStaffRelation;
