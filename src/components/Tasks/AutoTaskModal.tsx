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
    type: 'month' as 'month' | 'quarter' | 'year' | 'manual',
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    year: new Date().getFullYear(),
  });
  const [manualDueDate, setManualDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTitle, setManualTitle] = useState('');

  // Check if the current compliance type requires manual mode (for 'Others' type)
  const getSelectedComplianceType = () => {
    if (!initialComplianceCode || initialComplianceCode === 'ALL') return null;
    return complianceTypes.find(ct => ct.code === initialComplianceCode);
  };

  const isManualMode = () => {
    const compliance = getSelectedComplianceType();
    return compliance?.frequency === 'as_needed' || compliance?.code === 'OTHERS';
  };
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStats, setGenerationStats] = useState<{ total: number; random: number; defined: number } | null>(null);
  const [executionMode, setExecutionMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  const clientHasWorkType = (client: Client, code: string): boolean => {
    // If code is a Category (e.g., 'GST'), check if client has this category in work_types
    const isCategory = complianceTypes.some(ct => ct.category === code);
    if (isCategory) {
      // Check if client has this category in their work_types
      return client.work_types.some(wt =>
        wt.toUpperCase() === code.toUpperCase() ||
        wt.toLowerCase().replace(/\s+/g, '') === code.toLowerCase().replace(/\s+/g, '')
      );
    }

    // For specific compliance codes (e.g., 'GSTR-1'), find the compliance type and check its category
    const compliance = complianceTypes.find(ct => ct.code === code);
    if (compliance) {
      // Check if client's work_types includes this compliance's category
      return client.work_types.some(wt =>
        wt.toUpperCase() === compliance.category.toUpperCase() ||
        wt.toLowerCase().replace(/\s+/g, '') === compliance.category.toLowerCase().replace(/\s+/g, '')
      );
    }

    // Fallback: direct code match (case-insensitive)
    return client.work_types.some(wt => wt.toUpperCase() === code.toUpperCase());
  };

  useEffect(() => {
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      const applicableClients = clients.filter(c =>
        clientHasWorkType(c, initialComplianceCode)
      ).map(c => c.id);
      setSelectedClients(applicableClients);
      const compliance = complianceTypes.find(ct => ct.code === initialComplianceCode);
      if (compliance) {
        if (compliance.frequency === 'monthly') setSelectedPeriod(prev => ({ ...prev, type: 'month' }));
        else if (compliance.frequency === 'quarterly') setSelectedPeriod(prev => ({ ...prev, type: 'quarter' }));
        else if (compliance.frequency === 'yearly') setSelectedPeriod(prev => ({ ...prev, type: 'year' }));
        else if (compliance.frequency === 'as_needed') setSelectedPeriod(prev => ({ ...prev, type: 'manual' }));
      }
    }
  }, [initialComplianceCode, clients, complianceTypes]);

  const formatDateForInput = (year: number, month: number, day: number): string => {
    const yyyy = year.toString();
    const mm = (month + 1).toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getApplicableComplianceTypes = () => {
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      const isCategory = complianceTypes.some(ct => ct.category === initialComplianceCode);
      if (isCategory) {
        // Filter by category and frequency (for manual mode, include 'as_needed')
        const frequencyMap: Record<string, string> = { month: 'monthly', quarter: 'quarterly', year: 'yearly', manual: 'as_needed' };
        return complianceTypes.filter(ct => ct.category === initialComplianceCode && ct.frequency === frequencyMap[selectedPeriod.type]);
      }
      return complianceTypes.filter(ct => ct.code === initialComplianceCode);
    }
    const frequencyMap: Record<string, string> = { month: 'monthly', quarter: 'quarterly', year: 'yearly', manual: 'as_needed' };
    return complianceTypes.filter(ct => ct.frequency === frequencyMap[selectedPeriod.type]);
  };

  const generateTasks = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const relations = await clientsService.getClientStaffRelations();
      const tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[] = [];
      const applicableCompliances = getApplicableComplianceTypes();
      const getPeriodText = () => {
        if (selectedPeriod.type === 'manual') return ''; // No period for manual/as_needed tasks
        if (selectedPeriod.type === 'month') return `${months[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
        if (selectedPeriod.type === 'quarter') return `Q${selectedPeriod.quarter} FY${selectedPeriod.year}-${(selectedPeriod.year + 1).toString().slice(2)}`;
        if (selectedPeriod.type === 'year') return `FY ${selectedPeriod.year}-${(selectedPeriod.year + 1).toString().slice(2)}`;
        return '';
      };
      const periodText = getPeriodText();
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

          // Calculate due year - Q3 and Q4 roll into next year
          let dueYear = year;
          if (quarter === 3 || quarter === 4) {
            dueYear = year + 1;
          }

          return formatDateForInput(dueYear, dueMonth, day);
        } else if (frequency === 'yearly' && selectedPeriod.type === 'year') {
          const { year } = selectedPeriod;
          // For yearly returns, due date is typically in the following assessment year
          let dueMonth = 6; // July (0-indexed)
          const dueYear = year + 1;

          // Special cases for different compliance types
          if (code === 'TAX_AUDIT' || code === 'TAX-AUDIT' || code === 'AUDIT') {
            dueMonth = 8; // September
          } else if (code === '3CEB' || code === 'TP-AUDIT') {
            dueMonth = 9; // October
          } else if (code === 'ITR_AUDIT') {
            dueMonth = 10; // October/November
          } else if (code.startsWith('GSTR9')) {
            dueMonth = 11; // December
          }
          return formatDateForInput(dueYear, dueMonth, day);
        } else if (frequency === 'as_needed') {
          // Use manual due date for 'as_needed' frequency
          return manualDueDate;
        }
        return new Date().toISOString().split('T')[0];
      };
      const clientsToProcess = selectedClients.length > 0 ? clients.filter(c => selectedClients.includes(c.id)) : clients;
      let randomCount = 0;
      let definedCount = 0;
      const activeStaff = staff.filter(s => s.is_active);
      clientsToProcess.forEach(client => {
        applicableCompliances.forEach(compliance => {
          if (clientHasWorkType(client, compliance.code)) {
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
              // For manual mode (Others), use custom title or compliance name without period
              const taskTitle = selectedPeriod.type === 'manual'
                ? (manualTitle.trim() || compliance.name)
                : `${compliance.name} - ${periodText}`;
              tasks.push({
                firm_id: client.firm_id,
                client_id: client.id,
                staff_id: assignedStaffId,
                compliance_type_id: compliance.id,
                title: taskTitle,
                description: `${compliance.name} for ${client.name}`,
                due_date: getDueDate(compliance),
                status: executionMode === 'scheduled' ? 'scheduled' : 'assigned',
                scheduled_for: executionMode === 'scheduled' ? scheduledDate : undefined,
                priority: 'medium',
                period: periodText,
                assigned_by: useAuthStore.getState().user?.id || '',
              });
            }
          }
        });
      });
      if (tasks.length > 0) {
        console.log(`[AutoTask] Generated ${tasks.length} tasks (${definedCount} defined, ${randomCount} random).`);
        setGenerationStats({ total: tasks.length, random: randomCount, defined: definedCount });
        await onGenerate(tasks);
      } else {
        console.warn('[AutoTask] No tasks generated for selected criteria.');
        setError('No tasks were generated.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate tasks.');
    } finally { setIsGenerating(false); }
  };

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]);
  };

  const selectAllClients = () => {
    if (initialComplianceCode && initialComplianceCode !== 'ALL') {
      setSelectedClients(clients.filter(c => clientHasWorkType(c, initialComplianceCode)).map(c => c.id));
    } else setSelectedClients(clients.map(c => c.id));
  };

  const clearAllClients = () => setSelectedClients([]);


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
          <p className="text-gray-600 mb-6">Tasks have been processed.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-left">
            <div className="flex justify-between"><span>Total Tasks:</span><span className="font-semibold text-gray-900">{generationStats.total}</span></div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between text-sm"><span className="text-blue-600">Smart Assigned:</span><span className="font-medium text-blue-700">{generationStats.defined}</span></div>
            <div className="flex justify-between text-sm"><span className="text-orange-600">Randomly Assigned:</span><span className="font-medium text-orange-700">{generationStats.random}</span></div>
          </div>
          <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>{initialComplianceCode && initialComplianceCode !== 'ALL' ? `${initialComplianceCode} Task Generation` : 'Auto Generate Tasks'}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2"><Calendar className="h-5 w-5 text-blue-600" /><span>Select Period</span></h3>
              {(!initialComplianceCode || initialComplianceCode === 'ALL') && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['month', 'quarter', 'year'] as const).map(type => (
                    <button key={type} onClick={() => setSelectedPeriod(prev => ({ ...prev, type }))} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedPeriod.type === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{type.charAt(0).toUpperCase() + type.slice(1)}ly</button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {selectedPeriod.type === 'month' && (
                <>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Month</label>
                    <select value={selectedPeriod.month} onChange={e => setSelectedPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Year</label>
                    <select value={selectedPeriod.year} onChange={e => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select></div>
                </>
              )}
              {selectedPeriod.type === 'quarter' && (
                <>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Quarter</label>
                    <select value={selectedPeriod.quarter} onChange={e => setSelectedPeriod(prev => ({ ...prev, quarter: parseInt(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value={1}>Q1 (Apr-Jun)</option>
                      <option value={2}>Q2 (Jul-Sep)</option>
                      <option value={3}>Q3 (Oct-Dec)</option>
                      <option value={4}>Q4 (Jan-Mar)</option>
                    </select></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Year</label>
                    <select value={selectedPeriod.year} onChange={e => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>FY {y}-{(y + 1).toString().slice(2)}</option>)}
                    </select></div>
                </>
              )}
              {selectedPeriod.type === 'year' && (
                <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Financial Year</label>
                  <select value={selectedPeriod.year} onChange={e => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>FY {y}-{(y + 1).toString().slice(2)}</option>)}
                  </select></div>
              )}
              {selectedPeriod.type === 'manual' && (
                <>
                  <div className="col-span-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800 font-medium">Manual Due Date Mode</p>
                      <p className="text-xs text-amber-600 mt-1">Set the due date and optionally a custom task title for this compliance type.</p>
                    </div>
                  </div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={manualDueDate}
                      onChange={e => setManualDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Custom Title (Optional)</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      placeholder="Leave empty to use compliance name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </section>
          <section>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2"><Building className="h-5 w-5 text-blue-600" /><span>Select Clients</span></h3>
              <div className="flex items-center space-x-3"><button onClick={selectAllClients} className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors">Select All</button><div className="w-px h-3 bg-gray-300"></div><button onClick={clearAllClients} className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors">Clear All</button></div>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50/30">
              <div className="p-2 divide-y divide-gray-100">
                {clients.filter(c => !initialComplianceCode || initialComplianceCode === 'ALL' || clientHasWorkType(c, initialComplianceCode)).map(client => (
                  <label key={client.id} className="flex items-center space-x-3 hover:bg-white p-3 rounded-lg cursor-pointer group">
                    <input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => handleClientToggle(client.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900 truncate">{client.name}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {client.work_types.slice(0, 2).map(wt => (
                            <span key={wt} className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{wt}</span>
                          ))}
                          {client.work_types.length > 2 && <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full border border-gray-100">+{client.work_types.length - 2}</span>}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>
          <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center uppercase tracking-widest"><Zap className="h-4 w-4 mr-2 text-blue-600" />Execution Mode</h4>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <label className={`flex-1 flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${executionMode === 'immediate' ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-white border-gray-200'}`}><input type="radio" className="sr-only" checked={executionMode === 'immediate'} onChange={() => setExecutionMode('immediate')} />
                <div className={`p-2 rounded-full mr-4 ${executionMode === 'immediate' ? 'bg-blue-600' : 'bg-gray-200'}`}><div className="h-2.5 w-2.5 rounded-full bg-white" /></div>
                <div><div className="text-sm font-black text-gray-900 uppercase">Run Now</div><div className="text-[10px] text-gray-500">Create tasks immediately</div></div></label>
              <label className={`flex-1 flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${executionMode === 'scheduled' ? 'bg-indigo-50 border-indigo-600 shadow-md' : 'bg-white border-gray-200'}`}><input type="radio" className="sr-only" checked={executionMode === 'scheduled'} onChange={() => setExecutionMode('scheduled')} />
                <div className={`p-2 rounded-full mr-4 ${executionMode === 'scheduled' ? 'bg-indigo-600' : 'bg-gray-200'}`}><div className="h-2.5 w-2.5 rounded-full bg-white" /></div>
                <div><div className="text-sm font-black text-gray-900 uppercase">Schedule</div><div className="text-[10px] text-gray-500">Queue for later</div></div></label>
            </div>
            {executionMode === 'scheduled' && (
              <div className="animate-in slide-in-from-top-2 bg-white p-4 rounded-lg border border-indigo-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Target Date</label>
                <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border-2 border-indigo-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:outline-none" />
              </div>
            )}
          </section>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs font-bold text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button onClick={generateTasks} disabled={isGenerating || selectedClients.length === 0} className="flex-[2] bg-blue-600 text-white py-3.5 px-6 rounded-xl font-black uppercase hover:bg-blue-700 shadow-md active:scale-95 transition-all flex items-center justify-center space-x-3">{isGenerating ? <> <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> <span>{executionMode === 'immediate' ? 'Generating...' : 'Scheduling...'}</span> </> : <> <Zap className="h-5 w-5 fill-current" /> <span>{executionMode === 'immediate' ? 'Execute' : 'Schedule'}</span> </>}</button>
            <button onClick={onClose} className="flex-1 bg-white text-gray-600 border-2 border-gray-200 py-3.5 px-6 rounded-xl font-black uppercase hover:bg-gray-50 active:scale-95 transition-all">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoTaskModal;
