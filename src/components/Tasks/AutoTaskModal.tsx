import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { X, Calendar, Building, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Client, Staff, ComplianceType, Task } from '../../types';
import { clientsService } from '../../services/clients.service';

interface AutoTaskModalProps {
  clients: Client[];
  staff: Staff[];
  complianceTypes: ComplianceType[];
  initialComplianceCode?: string | null;
  onClose: () => void;
  onGenerate: (tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]) => void | Promise<void>;
}

const AutoTaskModal: React.FC<AutoTaskModalProps> = ({
  clients,
  staff,
  complianceTypes,
  initialComplianceCode,
  onClose,
  onGenerate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStats, setGenerationStats] = useState<{ total: number; random: number; defined: number } | null>(null);

  useEffect(() => {
    // If specific tile clicked, pre-select type and valid clients (all of them by default)
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      setSelectedTaskTypes([initialComplianceCode]);

      const applicableClients = clients.filter(c =>
        c.work_types.some(wt => wt.includes(initialComplianceCode) || initialComplianceCode.includes(wt))
        // Note: Simple partial match or exact match depending on data cleanliness. 
        // e.g. Tile 'GSTR-1' matches work_type 'GSTR-1'.
        // If data is exact: c.work_types.includes(initialComplianceCode)
      ).map(c => c.id);

      setSelectedClients(applicableClients);
    } else {
      // Default select all if custom mode
      // Or maybe let user select? 
      // "The user shall be able to select the clients or have a select all button"
      // Let's start with empty or none for Custom.
    }
  }, [initialComplianceCode, clients]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthlyComplianceTypes = () => {
    return complianceTypes.filter(ct => ct.frequency === 'monthly');
  };

  const generateTasks = async () => {
    setIsGenerating(true);

    try {
      const relations = await clientsService.getClientStaffRelations();

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

      let randomCount = 0;
      let definedCount = 0;

      const activeStaff = staff.filter(s => s.is_active);

      clientsToProcess.forEach(client => {
        monthlyCompliances.forEach(compliance => {
          // Check if client has this work type
          if (client.work_types.includes(compliance.code)) {

            // Determine Assignee
            let assignedStaffId = '';
            const relation = relations.find(r => r.client_id === client.id);

            if (relation && activeStaff.some(s => s.user_id === relation.staff_id)) {
              // Ensure the assigned staff is active and exists
              // Note: relations.staff_id stores user_id. Task.staff_id stores user_id.
              assignedStaffId = relation.staff_id;
              definedCount++;
            } else if (activeStaff.length > 0) {
              // Random assignment
              const randomStaff = activeStaff[Math.floor(Math.random() * activeStaff.length)];
              assignedStaffId = randomStaff.user_id; // Using user_id for tasks as per schema references? 
              // Wait, tasks table `staff_id` references `users(id)`. Correct.
              randomCount++;
            }

            if (assignedStaffId) {
              // Find Firm ID (from client)
              const firmId = client.firm_id;

              tasks.push({
                firm_id: firmId,
                client_id: client.id,
                staff_id: assignedStaffId,
                compliance_type_id: compliance.id,
                title: `${compliance.name} - ${monthName} ${selectedYear}`,
                description: `Monthly ${compliance.name} for ${client.name}`,
                due_date: getDueDate(compliance.code),
                status: 'assigned',
                priority: 'medium',
                period: `${monthName} ${selectedYear}`,
                assigned_by: useAuthStore.getState().user?.id || '',
              });
            }
          }
        });
      });

      // Don't close immediately, show stats
      setGenerationStats({
        total: tasks.length,
        random: randomCount,
        defined: definedCount
      });

      // Pass tasks to parent for actual creation
      if (tasks.length > 0) {
        onGenerate(tasks);
      }

    } catch (error) {
      console.error("Error generating tasks", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    // If filtered by type, only select relevant ones? 
    // Usually 'Select All' means all currently visible/valid for the type.
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      const applicableClients = clients.filter(c =>
        c.work_types.includes(initialComplianceCode)
      ).map(c => c.id);
      setSelectedClients(applicableClients);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const clearAllClients = () => {
    setSelectedClients([]);
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

  if (generationStats) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generation Successful!</h2>
          <p className="text-gray-600 mb-6">Tasks have been queued for creation.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tasks:</span>
              <span className="font-semibold text-gray-900">{generationStats.total}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Smart Assigned (Relations):</span>
              <span className="font-medium text-blue-700">{generationStats.defined}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600">Randomly Assigned:</span>
              <span className="font-medium text-orange-700">{generationStats.random}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>
              {initialComplianceCode && initialComplianceCode !== 'ALL'
                ? `Generate ${initialComplianceCode} Tasks`
                : 'Auto Generate Monthly Tasks'}
            </span>
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
                <span>Select Clients {initialComplianceCode && initialComplianceCode !== 'ALL' ? `(with ${initialComplianceCode})` : ''}</span>
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
                {clients
                  .filter(client =>
                    !initialComplianceCode ||
                    initialComplianceCode === 'ALL' ||
                    client.work_types.includes(initialComplianceCode)
                  )
                  .map(client => (
                    <label key={client.id} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => handleClientToggle(client.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{client.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {initialComplianceCode && initialComplianceCode !== 'ALL'
                              ? initialComplianceCode
                              : client.work_types.join(', ')}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}

                {clients.filter(client =>
                  !initialComplianceCode ||
                  initialComplianceCode === 'ALL' ||
                  client.work_types.includes(initialComplianceCode)
                ).length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No applicable clients found for {initialComplianceCode || 'selection'}.
                    </div>
                  )}
              </div>
            </div>

            {selectedClients.length === 0 && (
              <p className="text-sm text-red-500 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Please select at least one client.
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
                  <p>Clients: {selectedClients.length}</p>
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
              disabled={isGenerating || selectedClients.length === 0}
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
