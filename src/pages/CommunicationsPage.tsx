import React, { useState, useEffect } from 'react';
import { Mail, Clock, Plus, Edit2, Trash2, Power, PowerOff, FileText, Send } from 'lucide-react';
import { emailAutomationService, EmailTemplate, ClientEmailSchedule } from '../services/email-automation.service';
import { useClients } from '../hooks/useClients';
import EmailTemplateModal from '../components/Communications/EmailTemplateModal';
import EmailScheduleModal from '../components/Communications/EmailScheduleModal';

const CommunicationsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'templates' | 'schedules'>('templates');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [schedules, setSchedules] = useState<ClientEmailSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>();
    const [editingSchedule, setEditingSchedule] = useState<ClientEmailSchedule | undefined>();

    const { clients } = useClients();

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [templatesData, schedulesData] = await Promise.all([
                emailAutomationService.getTemplates(),
                emailAutomationService.getSchedules()
            ]);
            setTemplates(templatesData);
            setSchedules(schedulesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Template Handlers ---
    const handleSaveTemplate = async (template: Omit<EmailTemplate, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => {
        try {
            if (editingTemplate) {
                await emailAutomationService.updateTemplate(editingTemplate.id, template);
            } else {
                await emailAutomationService.createTemplate(template);
            }
            loadData();
            setShowTemplateModal(false);
            setEditingTemplate(undefined);
        } catch (error) {
            console.error('Save template error:', error);
            throw error;
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure? This will also delete any associated schedules.')) return;
        try {
            await emailAutomationService.deleteTemplate(id);
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // --- Schedule Handlers ---
    const handleSaveSchedule = async (schedule: Omit<ClientEmailSchedule, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'last_sent_at'>) => {
        try {
            if (editingSchedule) {
                await emailAutomationService.updateSchedule(editingSchedule.id, schedule);
            } else {
                await emailAutomationService.createSchedule(schedule);
            }
            loadData();
            setShowScheduleModal(false);
            setEditingSchedule(undefined);
        } catch (error) {
            console.error('Save schedule error:', error);
            throw error;
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (!confirm('Stop sending this scheduled email?')) return;
        try {
            await emailAutomationService.deleteSchedule(id);
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleToggleSchedule = async (id: string, currentStatus: boolean) => {
        try {
            await emailAutomationService.updateSchedule(id, { is_active: !currentStatus });
            loadData();
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Client Communications</h1>
                    <p className="text-gray-600">Manage email templates and automated schedules</p>
                </div>
                <button
                    onClick={() => activeTab === 'templates' ? setShowTemplateModal(true) : setShowScheduleModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>{activeTab === 'templates' ? 'New Template' : 'New Schedule'}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'templates'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <FileText className="h-4 w-4" />
                    <span>Email Templates</span>
                </button>
                <button
                    onClick={() => setActiveTab('schedules')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'schedules'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Clock className="h-4 w-4" />
                    <span>Automation Schedules</span>
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : activeTab === 'templates' ? (
                    // Templates Table
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {templates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                        <p>No email templates found</p>
                                    </td>
                                </tr>
                            ) : (
                                templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{template.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                                            {template.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${template.template_type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                                                    template.template_type === 'invoice' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {template.template_type.charAt(0).toUpperCase() + template.template_type.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingTemplate(template);
                                                        setShowTemplateModal(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    // Schedules Table
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {schedules.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                        <p>No active automation schedules</p>
                                    </td>
                                </tr>
                            ) : (
                                schedules.map((schedule) => (
                                    <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {schedule.client?.name || 'Unknown Client'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {schedule.template?.name || 'Unknown Template'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            Day {schedule.schedule_day} ({schedule.frequency})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {schedule.last_sent_at ? (
                                                <span className="flex items-center text-green-600">
                                                    <Send className="h-3 w-3 mr-1" />
                                                    {formatDate(schedule.last_sent_at)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Never</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {schedule.is_active ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleSchedule(schedule.id, schedule.is_active)}
                                                    className={`p-1 rounded ${schedule.is_active ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title={schedule.is_active ? 'Pause' : 'Activate'}
                                                >
                                                    {schedule.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingSchedule(schedule);
                                                        setShowScheduleModal(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {showTemplateModal && (
                <EmailTemplateModal
                    template={editingTemplate}
                    onClose={() => {
                        setShowTemplateModal(false);
                        setEditingTemplate(undefined);
                    }}
                    onSave={handleSaveTemplate}
                />
            )}

            {showScheduleModal && (
                <EmailScheduleModal
                    schedule={editingSchedule}
                    clients={clients}
                    templates={templates}
                    onClose={() => {
                        setShowScheduleModal(false);
                        setEditingSchedule(undefined);
                    }}
                    onSave={handleSaveSchedule}
                />
            )}
        </div>
    );
};

export default CommunicationsPage;
