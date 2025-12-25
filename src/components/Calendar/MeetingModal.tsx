import * as React from 'react';
const { useState } = React;
import { X, Link, MapPin } from 'lucide-react';
import { Staff, Client, Meeting } from '../../types';

interface MeetingModalProps {
    staff: Staff[];
    clients: Client[];
    onClose: () => void;
    onSubmit: (meeting: Omit<Meeting, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({
    staff,
    clients,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        staff_id: '',
        start_time: '',
        end_time: '',
        location: '',
        meeting_link: '',
        description: '',
        status: 'scheduled' as Meeting['status'],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.client_id || !formData.start_time || !formData.end_time) {
            alert('Please fill in all required fields');
            return;
        }
        onSubmit(formData);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Schedule Meeting</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                            <select
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
                            <select
                                name="staff_id"
                                value={formData.staff_id}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">Select Staff</option>
                                {staff.map(s => <option key={s.id} value={s.user_id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                            <input
                                type="datetime-local"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                            <input
                                type="datetime-local"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2"
                                    placeholder="Office / Room"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Video Link</label>
                            <div className="relative">
                                <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="meeting_link"
                                    value={formData.meeting_link}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2"
                                    placeholder="Zoom / Google Meet URL"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                            Schedule
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingModal;
