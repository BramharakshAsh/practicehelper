import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { X, Calendar, User, Building, FileText } from 'lucide-react';
import { Task, Staff, Client, ComplianceType } from '../../types';

interface TaskModalProps {
  staff: Staff[];
  clients: Client[];
  complianceTypes: ComplianceType[];
  initialData?: Partial<Task>;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => void | Promise<void>;
}

const TaskModal: React.FC<TaskModalProps> = ({
  staff,
  clients,
  complianceTypes,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    client_id: initialData?.client_id || '',
    staff_id: initialData?.staff_id || '',
    compliance_type_id: initialData?.compliance_type_id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    due_date: initialData?.due_date ? initialData.due_date.split('T')[0] : '',
    priority: initialData?.priority || 'medium',
    period: initialData?.period || '',
  });

  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !formData.staff_id) {
      const currentStaff = staff.find(s => s.user_id === user.id);
      if (currentStaff) {
        setFormData(prev => ({ ...prev, staff_id: user.id }));
      }
    }
  }, [user, staff]);

  // Helper to parse the initial period string to get month, quarter, and year
  const getInitialPeriodState = () => {
    const defaultState = {
      type: '',
      month: new Date().getMonth() + 1,
      quarter: Math.floor(new Date().getMonth() / 3) + 1,
      year: new Date().getFullYear(),
    };

    if (!initialData?.compliance_type_id) return defaultState;

    const comp = complianceTypes.find(c => c.id === initialData.compliance_type_id);
    if (!comp) return defaultState;

    let type = '';
    if (comp.frequency === 'monthly') type = 'month';
    else if (comp.frequency === 'quarterly') type = 'quarter';
    else if (comp.frequency === 'yearly') type = 'year';

    defaultState.type = type;

    if (!initialData?.period) return defaultState;

    const periodStr = initialData.period;

    // Parse year from patterns like "FY 2024-25" or "FY2024"
    const yearMatch = periodStr.match(/FY\s*(\d{4})/i) || periodStr.match(/(\d{4})/);
    if (yearMatch) {
      defaultState.year = parseInt(yearMatch[1], 10);
    }

    if (type === 'month') {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const foundMonth = months.findIndex(m => periodStr.includes(m));
      if (foundMonth !== -1) {
        defaultState.month = foundMonth + 1;
      }
    } else if (type === 'quarter') {
      const qMatch = periodStr.match(/Q([1-4])/i);
      if (qMatch) {
        defaultState.quarter = parseInt(qMatch[1], 10);
      }
    }

    return defaultState;
  };

  const [selectedPeriod, setSelectedPeriod] = useState(getInitialPeriodState());

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

    const isManual = selectedCompliance.category === 'Others' || selectedCompliance.category === 'Other' || selectedCompliance.frequency === 'as_needed';

    // For manual mode, don't auto-calculate - let user enter manually
    if (isManual) {
      setFormData(prev => ({
        ...prev,
        title: prev.title || selectedCompliance.name, // Only overwrite title if empty
        due_date: prev.due_date || '', // Preserve user entered due date
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

      let dueMonth: number;
      let dueYear = year;
      let dueDayToUse = due_day;

      const isAdvanceTax = selectedCompliance.name.toLowerCase().includes('advance tax') || selectedCompliance.code === 'ADV_TAX' || selectedCompliance.code === 'ADVANCE_TAX';

      if (isAdvanceTax) {
        // Advance Tax quarters:
        // Q1 (Apr-Jun) -> 15th Jun
        // Q2 (Jul-Sep) -> 15th Sept
        // Q3 (Oct-Dec) -> 15th Dec
        // Q4 (Jan-Mar) -> 15th Mar (next year)
        const advTaxMonths = [5, 8, 11, 2]; // June, Sept, Dec, March (0-indexed)
        dueMonth = advTaxMonths[quarter - 1];
        dueDayToUse = 15;

        if (quarter === 4) {
          dueYear = year + 1;
        }
      } else {
        // TDS quarters: Q1(Apr-Jun), Q2(Jul-Sep), Q3(Oct-Dec), Q4(Jan-Mar)
        // Due dates: Q1 due July 31, Q2 due Oct 31, Q3 due Jan 31, Q4 due May 31
        const dueMonths = [6, 9, 0, 4]; // July, October, January, May (0-indexed)
        dueMonth = dueMonths[quarter - 1];

        // Calculate due year - Q3 and Q4 roll into next year
        if (quarter === 3 || quarter === 4) {
          dueYear = year + 1;
        }
      }

      dueDateStr = formatDateForInput(dueYear, dueMonth, dueDayToUse);
      periodText = `Q${quarter} FY${year}`;
    } else if (frequency === 'yearly' && selectedPeriod.type === 'year') {
      const { year } = selectedPeriod;
      // For yearly returns, due date is typically in the following assessment year
      // ITR for FY 2023-24 is due July 31, 2024
      let dueMonth = 6; // July (0-indexed)
      const dueYear = year + 1;

      // Special cases for different compliance types
      if (selectedCompliance.code === 'TAX_AUDIT' || selectedCompliance.code === 'TAX-AUDIT' || selectedCompliance.code === 'AUDIT' || selectedCompliance.code === 'STAT_AUDIT') {
        dueMonth = 8; // September
      } else if (selectedCompliance.code === '3CEB' || selectedCompliance.code === 'TP-AUDIT') {
        dueMonth = 9; // October
      } else if (selectedCompliance.code === 'ITR_AUDIT') {
        dueMonth = 9; // October/November
      } else if (selectedCompliance.code.startsWith('GSTR9')) {
        dueMonth = 11; // December
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.client_id || !formData.staff_id || !formData.compliance_type_id || !formData.title || !formData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTask: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'> = {
        ...formData,
        status: 'assigned',
        assigned_by: useAuthStore.getState().user?.id || '',
      };

      await onSubmit(newTask);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComplianceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const complianceId = e.target.value;
    const compliance = complianceTypes.find(ct => ct.id === complianceId);

    setFormData(prev => {
      const isSwitchingToOthers = compliance?.category === 'Others' || compliance?.category === 'Other' || compliance?.frequency === 'as_needed';
      return {
        ...prev,
        compliance_type_id: complianceId,
        ...(isSwitchingToOthers ? { period: '', due_date: '', title: compliance.name } : {})
      };
    });

    // Reset period type based on compliance frequency
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                <Building className="h-4 w-4 inline mr-2" />
                Client *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                <User className="h-4 w-4 inline mr-2" />
                Assign to Staff *
              </label>
              <select
                name="staff_id"
                value={formData.staff_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                required
              >
                <option value="">Select Staff</option>
                {staff
                  .filter(member => {
                    if (user && ['staff', 'paid_staff', 'articles'].includes(user.role)) {
                      return member.user_id === user.id;
                    }
                    return true;
                  })
                  .map(member => (
                    <option key={member.id} value={member.user_id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                <User className="h-4 w-4 inline mr-2 text-gray-400" />
                Assigned By (You)
              </label>
              <input
                type="text"
                value={user?.full_name || 'Current User'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 bg-gray-50 focus:outline-none text-sm sm:text-base text-gray-500"
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                <FileText className="h-4 w-4 inline mr-2" />
                Compliance Type *
              </label>
              <select
                name="compliance_type_id"
                value={formData.compliance_type_id}
                onChange={handleComplianceChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-2 text-xs sm:text-sm">
                <Calendar className="h-4 w-4 inline mr-2" />
                Period *
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {selectedPeriod.type === 'month' && (
                  <>
                    <select
                      value={selectedPeriod.month}
                      onChange={(e) => handlePeriodChange('month', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                    >
                      {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={selectedPeriod.year}
                      onChange={(e) => handlePeriodChange('year', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                    >
                      <option value={1}>Q1 (Apr-Jun)</option>
                      <option value={2}>Q2 (Jul-Sep)</option>
                      <option value={3}>Q3 (Oct-Dec)</option>
                      <option value={4}>Q4 (Jan-Mar)</option>
                    </select>
                    <select
                      value={selectedPeriod.year}
                      onChange={(e) => handlePeriodChange('year', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
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
                    className="w-full col-span-2 border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
              placeholder="e.g., GSTR-3B - March 2024"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {(() => {
              const isManual = selectedCompliance?.category === 'Others' || selectedCompliance?.category === 'Other' || selectedCompliance?.frequency === 'as_needed';

              return (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Due Date * {!isManual && '(Auto-calculated)'}
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${isManual ? 'bg-white' : 'bg-gray-50'
                        }`}
                      required
                      readOnly={!isManual && !!selectedCompliance && !!selectedPeriod.type}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      Period {!isManual && '(Auto-filled)'}
                    </label>
                    <input
                      type="text"
                      name="period"
                      value={formData.period}
                      onChange={handleChange}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${isManual ? 'bg-white' : 'bg-gray-50'
                        }`}
                      placeholder={isManual ? 'Enter period manually (e.g., March 2024)' : 'e.g., March 2024, Q4 FY24'}
                      readOnly={!isManual}
                    />
                  </div>
                </>
              );
            })()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
              placeholder="Additional details about the task..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </form>

        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-shrink-0">
          <button
            type="submit"
            form="task-form"
            onClick={(_e) => {
              // Trigger form submission manually since the button is outside the form now
              const form = document.getElementById('task-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
            className="w-full sm:flex-1 bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-sm text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 sm:py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base shadow-sm font-medium"
          >
            Cancel
          </button>
        </div>
        {/* Hidden form for the button to trigger */}
        <form id="task-form" onSubmit={handleSubmit} className="hidden"></form>
      </div>
    </div>
  );
};

export default TaskModal;