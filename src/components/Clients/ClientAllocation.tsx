import React, { useState, useEffect } from 'react';
import { Client, Staff, ClientStaffRelation } from '../../types';
import { clientsService } from '../../services/clients.service';
import { Users, User, Shield, Check, Save, Download, Upload, Search, Filter } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ClientAllocationProps {
    clients: Client[];
    staff: Staff[];
    onAllocationUpdate: () => Promise<void>;
}

const ClientAllocation: React.FC<ClientAllocationProps> = ({ clients, staff, onAllocationUpdate }) => {
    const [relations, setRelations] = useState<ClientStaffRelation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [localAllocations, setLocalAllocations] = useState<Record<string, { staff_id: string; manager_id: string }>>({});
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadRelations();
    }, []);

    useEffect(() => {
        // Initialize local allocations from clients and relations
        const allocations: Record<string, { staff_id: string; manager_id: string }> = {};
        clients.forEach(client => {
            const relation = relations.find(r => r.client_id === client.id);
            allocations[client.id] = {
                staff_id: relation?.staff_id || '',
                manager_id: client.manager_id || '',
            };
        });
        setLocalAllocations(allocations);
    }, [clients, relations]);

    const loadRelations = async () => {
        try {
            const data = await clientsService.getClientStaffRelations();
            setRelations(data);
        } catch (error) {
            console.error('Failed to load relations:', error);
        }
    };

    const handleAllocationChange = (clientId: string, type: 'staff_id' | 'manager_id', value: string) => {
        setLocalAllocations(prev => ({
            ...prev,
            [clientId]: {
                ...prev[clientId],
                [type]: value,
            },
        }));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            for (const clientId of Object.keys(localAllocations)) {
                const { staff_id, manager_id } = localAllocations[clientId];
                const client = clients.find(c => c.id === clientId);

                // Update client manager if changed
                if (client && client.manager_id !== (manager_id || null)) {
                    await clientsService.updateClient(clientId, { manager_id: manager_id || undefined });
                }

                // Update staff relation if changed
                const currentRelation = relations.find(r => r.client_id === clientId);
                if (currentRelation?.staff_id !== (staff_id || null)) {
                    await clientsService.saveClientStaffRelation(clientId, staff_id);
                }
            }
            await loadRelations();
            await onAllocationUpdate();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save allocations:', error);
            alert('Failed to save some allocations. Please check console.');
        } finally {
            setIsSaving(false);
        }
    };

    const exportTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Allocations');

        worksheet.columns = [
            { header: 'Client Name', key: 'name', width: 30 },
            { header: 'Client PAN', key: 'pan', width: 15 },
            { header: 'Staff Name', key: 'staffName', width: 25 },
            { header: 'Staff Email', key: 'staffEmail', width: 25 },
            { header: 'Manager/Partner Name', key: 'managerName', width: 25 },
            { header: 'Manager/Partner Email', key: 'managerEmail', width: 25 },
        ];

        clients.forEach(client => {
            const allocation = localAllocations[client.id] || { staff_id: '', manager_id: '' };
            const assignedStaff = staff.find(s => s.user_id === allocation.staff_id);
            const assignedManager = staff.find(s => s.user_id === allocation.manager_id);

            worksheet.addRow({
                name: client.name,
                pan: client.pan,
                staffName: assignedStaff?.name || '',
                staffEmail: assignedStaff?.email || '',
                managerName: assignedManager?.name || '',
                managerEmail: assignedManager?.email || '',
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'Client_Allocations.xlsx');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file);
        const worksheet = workbook.worksheets[0];

        const newAllocations = { ...localAllocations };
        let updatedCount = 0;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const clientName = row.getCell(1).text;
            const clientPan = row.getCell(2).text;
            const staffEmail = row.getCell(4).text;
            const staffName = row.getCell(3).text;
            const managerEmail = row.getCell(6).text;
            const managerName = row.getCell(5).text;

            const client = clients.find(c => c.pan === String(clientPan).trim().toUpperCase() || c.name === clientName);
            if (client) {
                const staffMember = staff.find(s =>
                    s.email === String(staffEmail).trim().toLowerCase() ||
                    s.name.toLowerCase() === String(staffName).trim().toLowerCase()
                );
                const manager = staff.find(s =>
                    s.email === String(managerEmail).trim().toLowerCase() ||
                    s.name.toLowerCase() === String(managerName).trim().toLowerCase()
                );

                newAllocations[client.id] = {
                    staff_id: staffMember?.user_id || '',
                    manager_id: manager?.user_id || '',
                };
                updatedCount++;
            }
        });

        setLocalAllocations(newAllocations);
        alert(`Imported ${updatedCount} allocations. Review and click Save to apply.`);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const managers = staff.filter(s => ['manager', 'partner'].includes(s.role));
    const regularStaff = staff; // Everyone can be assigned as staff? Usually articles/paid_staff.

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Client Allocation</h2>
                    <p className="text-sm text-gray-500">Assign staff and managers to each client</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportTemplate}
                        className="flex items-center gap-2 px-3 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all text-sm font-medium"
                    >
                        <Download className="h-4 w-4" />
                        Export Template
                    </button>
                    <label className="flex items-center gap-2 px-3 py-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all text-sm font-medium cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Import Excel
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                    </label>
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search clients by name or PAN..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {showSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <Check className="h-5 w-5" />
                    Allocations saved successfully!
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Client Details</th>
                                <th className="px-6 py-4">Current Staff Assignment</th>
                                <th className="px-6 py-4">Manager / Partner</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredClients.map(client => {
                                const allocation = localAllocations[client.id] || { staff_id: '', manager_id: '' };
                                return (
                                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{client.name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{client.pan}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <select
                                                    value={allocation.staff_id}
                                                    onChange={(e) => handleAllocationChange(client.id, 'staff_id', e.target.value)}
                                                    className="bg-transparent border-none focus:ring-0 text-sm p-0 w-full cursor-pointer hover:text-blue-600 transition-colors"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {staff.map(s => (
                                                        <option key={s.id} value={s.user_id}>{s.name} ({s.role})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-gray-400" />
                                                <select
                                                    value={allocation.manager_id}
                                                    onChange={(e) => handleAllocationChange(client.id, 'manager_id', e.target.value)}
                                                    className="bg-transparent border-none focus:ring-0 text-sm p-0 w-full cursor-pointer hover:text-indigo-600 transition-colors font-medium"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {managers.map(m => (
                                                        <option key={m.id} value={m.user_id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientAllocation;
