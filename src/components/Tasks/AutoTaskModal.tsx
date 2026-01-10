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
  const [selectedPeriod, setSelectedPeriod] = useState({
    type: 'month' as 'month' | 'quarter' | 'year',
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    year: new Date().getFullYear(),
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStats, setGenerationStats] = useState<{ total: number; random: number; defined: number } | null>(null);

  // Helper function to map task types to parent compliance types
  const getParentComplianceType = (taskCode: string): string => {
    const mapping: Record<string, string> = {
      'GSTR-1': 'GST',
      'GSTR-3B': 'GST',
      'GSTR-9': 'GST',
      '24Q': 'TDS',
      '26Q': 'TDS',
      '27Q': 'TDS',
    };
    return mapping[taskCode] || taskCode;
  };

  // Helper function to check if client has the required work type for a task
  const clientHasWorkType = (client: Client, taskCode: string): boolean => {
    const parentType = getParentComplianceType(taskCode);
    return client.work_types.includes(parentType);
  };

  useEffect(() => {
    // If specific tile clicked, pre-select type and valid clients (all of them by default)
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      setSelectedTaskTypes([initialComplianceCode]);

      const applicableClients = clients.filter(c =>
        clientHasWorkType(c, initialComplianceCode)
      ).map(c => c.id);

      setSelectedClients(applicableClients);

      // Set period type based on compliance frequency
      const compliance = complianceTypes.find(ct => ct.code === initialComplianceCode);
      if (compliance) {
        if (compliance.frequency === 'monthly') {
          setSelectedPeriod(prev => ({ ...prev, type: 'month' }));
        } else if (compliance.frequency === 'quarterly') {
          setSelectedPeriod(prev => ({ ...prev, type: 'quarter' }));
        } else if (compliance.frequency === 'yearly') {
          setSelectedPeriod(prev => ({ ...prev, type: 'year' }));
        }
      }
    }
  }, [initialComplianceCode, clients, complianceTypes]);

  // Helper function to format date without timezone issues
  const formatDateForInput = (year: number, month: number, day: number): string => {
    const yyyy = year.toString();
    const mm = (month + 1).toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getApplicableComplianceTypes = () => {
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      return complianceTypes.filter(ct => ct.code === initialComplianceCode);
    }

    // For "ALL" mode, filter by the selected period type
    const frequencyMap: Record<string, string> = {
      month: 'monthly',
      quarter: 'quarterly',
      year: 'yearly'
    };

    return complianceTypes.filter(ct => ct.frequency === frequencyMap[selectedPeriod.type]);
  };

  const generateTasks = async () => {
    setIsGenerating(true);

    try {
      const relations = await clientsService.getClientStaffRelations();

      const tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[] = [];
      const applicableCompliances = getApplicableComplianceTypes();

      // Helper to get period text
      const getPeriodText = () => {
        if (selectedPeriod.type === 'month') {
          return `${months[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
        } else if (selectedPeriod.type === 'quarter') {
          return `Q${selectedPeriod.quarter} FY${selectedPeriod.year}`;
        } else if (selectedPeriod.type === 'year') {
          return `FY ${selectedPeriod.year}-${(selectedPeriod.year + 1).toString().slice(2)}`;
        }
        return '';
      };

      const periodText = getPeriodText();

      // Generate due dates based on compliance frequency and selected period
      const getDueDate = (compliance: ComplianceType) => {
        const { frequency, due_day, code } = compliance;
        const day = due_day || 20;

        if (frequency === 'monthly' && selectedPeriod.type === 'month') {
          const month = selectedPeriod.month - 1;
          const year = selectedPeriod.year;
          // Due date is in the following month
          const nextMonth = month === 11 ? 0 : month + 1;
          const nextYear = month === 11 ? year + 1 : year;
          return formatDateForInput(nextYear, nextMonth, day);
        } else if (frequency === 'quarterly' && selectedPeriod.type === 'quarter') {
          const { quarter, year } = selectedPeriod;
          // TDS quarters: Q1(Apr-Jun), Q2(Jul-Sep), Q3(Oct-Dec), Q4(Jan-Mar)
          // Due dates: Q1 due July 31, Q2 due Oct 31, Q3 due Jan 31, Q4 due May 31
          const dueMonths = [6, 9, 0, 4]; // July, October, January, May (0-indexed)
          const dueMonth = dueMonths[quarter - 1];

          let dueYear = year;
          if (quarter === 3 || quarter === 4) {
            dueYear = year + 1;
          }
          return formatDateForInput(dueYear, dueMonth, day);
        } else if (frequency === 'yearly' && selectedPeriod.type === 'year') {
          const { year } = selectedPeriod;
          let dueMonth = 6; // July
          let dueYear = year + 1;

          if (code === 'TAX-AUDIT' || code === 'AUDIT') dueMonth = 8; // Sep
          else if (code === 'TP-AUDIT') dueMonth = 9; // Oct
          else if (code === 'GSTR-9') dueMonth = 11; // Dec

          return formatDateForInput(dueYear, dueMonth, day);
        }

        // Fallback
        return new Date().toISOString();
      };

      const clientsToProcess = selectedClients.length > 0
        ? clients.filter(c => selectedClients.includes(c.id))
        : clients;

      let randomCount = 0;
      let definedCount = 0;

      const activeStaff = staff.filter(s => s.is_active);

      clientsToProcess.forEach(client => {
        applicableCompliances.forEach(compliance => {
          // Check if client has this work type (using parent compliance type mapping)
          if (clientHasWorkType(client, compliance.code)) {

            // Determine Assignee
            let assignedStaffId = '';
            const relation = relations.find(r => r.client_id === client.id);

            if (relation && activeStaff.some(s => s.user_id === relation.staff_id)) {
              assignedStaffId = relation.staff_id;
              definedCount++;
            } else if (activeStaff.length > 0) {
              const randomStaff = activeStaff[Math.floor(Math.random() * activeStaff.length)];
              assignedStaffId = randomStaff.user_id;
              randomCount++;
            }

            if (assignedStaffId) {
              const firmId = client.firm_id;

              tasks.push({
                firm_id: firmId,
                client_id: client.id,
                staff_id: assignedStaffId,
                compliance_type_id: compliance.id,
                title: `${compliance.name} - ${periodText}`,
                description: `${compliance.name} for ${client.name}`,
                due_date: getDueDate(compliance),
                status: 'assigned',
                priority: 'medium',
                period: periodText,
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
        clientHasWorkType(c, initialComplianceCode)
      ).map(c => c.id);
      setSelectedClients(applicableClients);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const clearAllClients = () => {
    setSelectedClients([]);
  };


  const getPeriodText = () => {
    if (selectedPeriod.type === 'month') {
      return `${months[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
    } else if (selectedPeriod.type === 'quarter') {
      return `Q${selectedPeriod.quarter} FY${selectedPeriod.year}`;
    } else if (selectedPeriod.type === 'year') {
      return `FY ${selectedPeriod.year}-${(selectedPeriod.year + 1).toString().slice(2)}`;
    }
    return '';
  };

  const periodText = getPeriodText();
  const applicableCompliancesTotal = getApplicableComplianceTypes();

  const estimatedTasks = (selectedClients.length > 0
    ? clients.filter(c => selectedClients.includes(c.id))
    : clients
  ).reduce((acc, client) => {
    const matchingCompliances = applicableCompliancesTotal.filter(c =>
      clientHasWorkType(client, c.code) &&
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
                : 'Auto Generate Tasks'}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Select Period</span>
              </h3>
              {(!initialComplianceCode || initialComplianceCode === 'ALL') && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['month', 'quarter', 'year'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedPeriod(prev => ({ ...prev, type }))}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedPeriod.type === type
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}ly
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {selectedPeriod.type === 'month' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <select
                      value={selectedPeriod.month}
                      onChange={(e) => setSelectedPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={selectedPeriod.year}
                      onChange={(e) => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[selectedPeriod.year - 1, selectedPeriod.year, selectedPeriod.year + 1].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {selectedPeriod.type === 'quarter' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
                    <select
                      value={selectedPeriod.quarter}
                      onChange={(e) => setSelectedPeriod(prev => ({ ...prev, quarter: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Q1 (Apr-Jun)</option>
                      <option value={2}>Q2 (Jul-Sep)</option>
                      <option value={3}>Q3 (Oct-Dec)</option>
                      <option value={4}>Q4 (Jan-Mar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year</label>
                    <select
                      value={selectedPeriod.year}
                      onChange={(e) => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[selectedPeriod.year - 1, selectedPeriod.year, selectedPeriod.year + 1].map(year => (
                        <option key={year} value={year}>FY {year}-{(year + 1).toString().slice(2)}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {selectedPeriod.type === 'year' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year</label>
                  <select
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[selectedPeriod.year - 1, selectedPeriod.year, selectedPeriod.year + 1].map(year => (
                      <option key={year} value={year}>FY {year}-{(year + 1).toString().slice(2)}</option>
                    ))}
                  </select>
                </div>
              )}
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
                    clientHasWorkType(client, initialComplianceCode)
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
                  clientHasWorkType(client, initialComplianceCode)
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
                  <p>Period: {periodText}</p>
                  <p>Clients: {selectedClients.length}</p>
                  <p>Task Types: {selectedTaskTypes.length > 0 ? selectedTaskTypes.join(', ') : 'All compliance types'}</p>
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
