import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { X, Calendar, User, Building, FileText } from 'lucide-react';
import { Task, Staff, Client, ComplianceType } from '../../types';

interface TaskModalProps {
  staff: Staff[];
  clients: Client[];
  complianceTypes: ComplianceType[];
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => void | Promise<void>;
}

const TaskModal: React.FC<TaskModalProps> = ({
  staff,
  clients,
  complianceTypes,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    client_id: '',
    staff_id: '',
    compliance_type_id: '',
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as Task['priority'],
    period: '',
  });

  const [selectedPeriod, setSelectedPeriod] = useState({
    type: '', // 'month', 'quarter', 'year'
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    year: new Date().getFullYear(),
  });

  const selectedCompliance = complianceTypes.find(ct => ct.id === formData.compliance_type_id);

  // Helper function to format date without timezone issues
  const formatDateForInput = (year: number, month: number, day: number): string => {
    const yyyy = year.toString();
    const mm = (month + 1).toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Auto-calculate due date when compliance type or period changes
  useEffect(() => {
    if (!selectedCompliance || !selectedPeriod.type) return;

    // For "Others" category, don't auto-calculate - let user enter manually
    if (selectedCompliance.category === 'Others') {
      // Only set period text, not due date
      let periodText = '';
      if (selectedCompliance.frequency === 'monthly' && selectedPeriod.type === 'month') {
        const month = selectedPeriod.month - 1;
        const year = selectedPeriod.year;
        periodText = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (selectedCompliance.frequency === 'yearly' && selectedPeriod.type === 'year') {
        const { year } = selectedPeriod;
        periodText = `FY ${year}-${(year + 1).toString().slice(2)}`;
      }

      setFormData(prev => ({
        ...prev,
        period: periodText,
        title: `${selectedCompliance.name} - ${periodText}`,
        due_date: '', // Clear due date for manual entry
      }));
      return;
    }

    const { frequency, due_day } = selectedCompliance;
    let dueDateStr: string;
    let periodText = '';

    if (frequency === 'monthly' && selectedPeriod.type === 'month') {
      const month = selectedPeriod.month - 1;
      const year = selectedPeriod.year;
      // Due date is in the following month
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      dueDateStr = formatDateForInput(nextYear, nextMonth, due_day);
      periodText = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (frequency === 'quarterly' && selectedPeriod.type === 'quarter') {
      const { quarter, year } = selectedPeriod;
      // TDS quarters: Q1(Apr-Jun), Q2(Jul-Sep), Q3(Oct-Dec), Q4(Jan-Mar)
      // Due dates: Q1 due July 31, Q2 due Oct 31, Q3 due Jan 31, Q4 due May 31
      const dueMonths = [6, 9, 0, 4]; // July, October, January, May (0-indexed)
      const dueMonth = dueMonths[quarter - 1];

      // Calculate due year - Q3 and Q4 roll into next year
      let dueYear = year;
      if (quarter === 3) {
        dueYear = year + 1; // Q3 (Oct-Dec) due Jan next year
      } else if (quarter === 4) {
        dueYear = year + 1; // Q4 (Jan-Mar) due May next year
      }

      dueDateStr = formatDateForInput(dueYear, dueMonth, due_day);
      periodText = `Q${quarter} FY${year}`;
    } else if (frequency === 'yearly' && selectedPeriod.type === 'year') {
      const { year } = selectedPeriod;
      // For yearly returns, due date is typically in the following assessment year
      // ITR for FY 2023-24 is due July 31, 2024
      let dueMonth = 6; // July (0-indexed)
      let dueYear = year + 1;

      // Special cases for different compliance types
      if (selectedCompliance.code === 'TAX-AUDIT') {
        dueMonth = 8; // September
      } else if (selectedCompliance.code === 'TP-AUDIT') {
        dueMonth = 9; // October
      } else if (selectedCompliance.code === 'GSTR-9') {
        dueMonth = 11; // December
      } else if (selectedCompliance.code === 'AUDIT') {
        dueMonth = 8; // September
      }

      dueDateStr = formatDateForInput(dueYear, dueMonth, due_day);
      periodText = `FY ${year}-${(year + 1).toString().slice(2)}`;
    } else {
      return;
    }

    setFormData(prev => ({
      ...prev,
      due_date: dueDateStr,
      period: periodText,
      title: `${selectedCompliance.name} - ${periodText}`,
    }));
  }, [selectedCompliance, selectedPeriod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.staff_id || !formData.compliance_type_id || !formData.title || !formData.due_date) {
      alert('Please fill in all required fields');
      return;
    }

    const newTask: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'> = {
      ...formData,
      status: 'assigned',
      assigned_by: useAuthStore.getState().user?.id || '',
    };

    onSubmit(newTask);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComplianceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const complianceId = e.target.value;
    const compliance = complianceTypes.find(ct => ct.id === complianceId);

    setFormData(prev => ({ ...prev, compliance_type_id: complianceId }));

    // Reset  period type based on compliance frequency
    if (compliance) {
      if (compliance.frequency === 'monthly') {
        setSelectedPeriod(prev => ({ ...prev, type: 'month' }));
      } else if (compliance.frequency === 'quarterly') {
        setSelectedPeriod(prev => ({ ...prev, type: 'quarter' }));
      } else if (compliance.frequency === 'yearly') {
        setSelectedPeriod(prev => ({ ...prev, type: 'year' }));
      } else {
        setSelectedPeriod(prev => ({ ...prev, type: '' }));
      }
    }
  };

  const handlePeriodChange = (field: string, value: number) => {
    setSelectedPeriod(prev => ({ ...prev, [field]: value }));
  };

  // Group compliance types by category
  const groupedCompliances = complianceTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, ComplianceType[]>);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Client *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Assign to Staff *
              </label>
              <select
                name="staff_id"
                value={formData.staff_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Staff</option>
                {staff.map(member => (
                  <option key={member.id} value={member.user_id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Compliance Type *
              </label>
              <select
                name="compliance_type_id"
                value={formData.compliance_type_id}
                onChange={handleComplianceChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Compliance Type</option>
                {Object.entries(groupedCompliances).map(([category, types]) => (
                  <optgroup key={category} label={category}>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Period Selection Based on Compliance Frequency */}
          {selectedCompliance && selectedPeriod.type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Period *
              </label>
              <div className="grid grid-cols-2 gap-4">
                {selectedPeriod.type === 'month' && (
                  <>
                    <select
                      value={selectedPeriod.month}
                      onChange={(e) => handlePeriodChange('month', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={selectedPeriod.year}
                      onChange={(e) => handlePeriodChange('year', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </>
                )}
                {selectedPeriod.type === 'quarter' && (
                  <>
                    <select
                      value={selectedPeriod.quarter}
                      onChange={(e) => handlePeriodChange('quarter', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Q1 (Apr-Jun)</option>
                      <option value={2}>Q2 (Jul-Sep)</option>
                      <option value={3}>Q3 (Oct-Dec)</option>
                      <option value={4}>Q4 (Jan-Mar)</option>
                    </select>
                    <select
                      value={selectedPeriod.year}
                      onChange={(e) => handlePeriodChange('year', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>FY {y}-{(y + 1).toString().slice(2)}</option>
                      ))}
                    </select>
                  </>
                )}
                {selectedPeriod.type === 'year' && (
                  <select
                    value={selectedPeriod.year}
                    onChange={(e) => handlePeriodChange('year', parseInt(e.target.value))}
                    className="w-full col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>FY {y}-{(y + 1).toString().slice(2)}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., GSTR-3B - March 2024"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Due Date * {selectedCompliance?.category !== 'Others' && '(Auto-calculated)'}
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCompliance?.category === 'Others' ? 'bg-white' : 'bg-gray-50'
                  }`}
                required
                readOnly={selectedCompliance?.category !== 'Others' && !!selectedCompliance && !!selectedPeriod.type}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period (Auto-filled)
              </label>
              <input
                type="text"
                name="period"
                value={formData.period}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="e.g., March 2024, Q4 FY24"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about the task..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;