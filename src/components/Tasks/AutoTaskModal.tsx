import React, { useState } from 'react';
import { X, Calendar, Building, Zap, AlertCircle } from 'lucide-react';
import { Client, Staff, ComplianceType, Task } from '../../types';

interface AutoTaskModalProps {
  clients: Client[];
  staff: Staff[];
  complianceTypes: ComplianceType[];
  onClose: () => void;
  onGenerate: (tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]) => void;
}

const AutoTaskModal: React.FC<AutoTaskModalProps> = ({
  clients,
  staff,
  complianceTypes,
  onClose,
  onGenerate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthlyComplianceTypes = () => {
    return complianceTypes.filter(ct => ct.frequency === 'monthly');
  };

  const generateTasks = () => {
    setIsGenerating(true);

    const tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[] = [];
    const monthlyCompliances = getMonthlyComplianceTypes().filter(ct =>
      selectedTaskTypes.length === 0 || selectedTaskTypes.includes(ct.code)
    );
    const monthName = months[selectedMonth];

    // Generate due dates for the selected month
    const getDueDate = (complianceCode: string) => {
      const dueDates: Record<string, number> = {
        'GSTR-1': 11,
        'GSTR-3B': 20,
        'GSTR-9': 31,
        '24Q': 31,
        '26Q': 31,
        '27Q': 31,
        'ITR': 31,
        'AUDIT': 30,
        'ACCOUNTING': 10,
        'NOTICES': 15,
        'PAYROLL': 15,
      };

      const day = dueDates[complianceCode] || 20;
      const dueMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const dueYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;

      return new Date(dueYear, dueMonth, day).toISOString();
    };

    const clientsToProcess = selectedClients.length > 0
      ? clients.filter(c => selectedClients.includes(c.id))
      : clients;

    clientsToProcess.forEach(client => {
      monthlyCompliances.forEach(compliance => {
        // Check if client has this work type
        if (client.work_types.includes(compliance.code)) {
          // Assign to a random active staff member
          const activeStaff = staff.filter(s => s.is_active);
          if (activeStaff.length > 0) {
            const assignedStaff = activeStaff[Math.floor(Math.random() * activeStaff.length)];

            tasks.push({
              client_id: client.id,
              staff_id: assignedStaff.id,
              compliance_type_id: compliance.id,
              title: `${compliance.name} - ${monthName} ${selectedYear}`,
              description: `Monthly ${compliance.name} for ${client.name}`,
              due_date: getDueDate(compliance.code),
              status: 'assigned',
              priority: 'medium',
              period: `${monthName} ${selectedYear}`,
              assigned_by: 'partner_1',
            });
          }
        }
      });
    });

    setTimeout(() => {
      onGenerate(tasks);
      setIsGenerating(false);
      onClose();
    }, 1500);
  };

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    setSelectedClients(clients.map(c => c.id));
  };

  const clearAllClients = () => {
    setSelectedClients([]);
  };

  const handleTaskTypeToggle = (taskType: string) => {
    setSelectedTaskTypes(prev =>
      prev.includes(taskType)
        ? prev.filter(type => type !== taskType)
        : [...prev, taskType]
    );
  };

  const selectAllTaskTypes = () => {
    setSelectedTaskTypes(['GSTR-1', 'GSTR-3B', 'ACCOUNTING', 'PAYROLL']);
  };

  const clearAllTaskTypes = () => {
    setSelectedTaskTypes([]);
  };

  const monthlyCompliances = getMonthlyComplianceTypes();

  const estimatedTasks = (selectedClients.length > 0
    ? clients.filter(c => selectedClients.includes(c.id))
    : clients
  ).reduce((acc, client) => {
    const matchingCompliances = monthlyCompliances.filter(c =>
      client.work_types.includes(c.code) &&
      (selectedTaskTypes.length === 0 || selectedTaskTypes.includes(c.code))
    );
    return acc + matchingCompliances.length;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Auto Generate Monthly Tasks</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Period Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Select Period</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Select Clients</span>
              </h3>
              <div className="space-x-2">
                <button
                  onClick={selectAllClients}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllClients}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                {clients.map(client => (
                  <label key={client.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{client.name}</span>
                      <div className="text-xs text-gray-500">
                        Work Types: {client.work_types.join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {selectedClients.length === 0 && (
              <p className="text-sm text-gray-600 mt-2">
                No clients selected. All clients will be included.
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Generation Summary</h4>
                <div className="text-sm text-blue-700 mt-1 space-y-1">
                  <p>Period: {months[selectedMonth]} {selectedYear}</p>
                  <p>Clients: {selectedClients.length || clients.length}</p>
                  <p>Task Types: {selectedTaskTypes.length > 0 ? selectedTaskTypes.join(', ') : 'All monthly compliance types'}</p>
                  <p>Estimated Tasks: ~{estimatedTasks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={generateTasks}
              disabled={isGenerating}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating Tasks...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Generate Tasks</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoTaskModal;