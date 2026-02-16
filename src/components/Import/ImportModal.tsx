import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useClientsStore } from '../../store/clients.store';
import { useStaffStore } from '../../store/staff.store';
import { useComplianceStore } from '../../store/compliance.store';

interface ImportModalProps {
  type: 'clients' | 'staff' | 'tasks';
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ type, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { clients } = useClientsStore();
  const { staff } = useStaffStore();
  const { complianceTypes } = useComplianceStore();

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      type === 'clients' ? 'Clients' : type === 'staff' ? 'Staff' : 'Tasks'
    );

    if (type === 'clients') {
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'PAN', key: 'pan', width: 15 },
        { header: 'GSTIN', key: 'gstin', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Legal Form', key: 'legal_form', width: 20 },
        { header: 'Client Group', key: 'client_group', width: 20 },
        { header: 'Assigned Manager', key: 'assigned_manager', width: 25 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'Special Instructions', key: 'special_instructions', width: 40 },
        { header: 'Points to Remember', key: 'points_to_remember', width: 40 },
        // Category Level Compliances
        { header: 'GST (Yes/No)', key: 'gst_work', width: 15 },
        { header: 'TDS (Yes/No)', key: 'tds_work', width: 15 },
        { header: 'Income Tax (Yes/No)', key: 'it_work', width: 20 },
        { header: 'Audit (Yes/No)', key: 'audit_work', width: 15 },
        { header: 'ROC (Yes/No)', key: 'roc_work', width: 15 },
        { header: 'Payroll (Yes/No)', key: 'payroll_work', width: 15 },
        { header: 'Accounting (Yes/No)', key: 'accounting_work', width: 15 },
      ];

      // Add Data Validations to first 100 rows
      for (let i = 2; i <= 101; i++) {
        const row = worksheet.getRow(i);

        // Legal Form (Column 6)
        row.getCell(6).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Individual/HUF,Partnership firm,Trust,LLP,Private company,Public company,section 8 company,Co-operative society,AOP/BOI"'],
        };

        // Assigned Manager List (Column 8)
        const managerNames = staff.map(s => s.name).join(',');
        if (managerNames) {
          row.getCell(8).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${managerNames}"`]
          };
        }

        // Yes/No columns (Index 12 to 18)
        for (let j = 12; j <= 18; j++) {
          row.getCell(j).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"Yes,No"'],
          };
        }
      }

      // Add sample data
      worksheet.addRow({
        name: 'ABC Enterprises Pvt Ltd',
        pan: 'ABCDE1234F',
        gstin: '29ABCDE1234F1Z5',
        email: 'contact@abc.com',
        phone: '+91 98765 43210',
        legal_form: 'Private company',
        client_group: 'Retailers',
        assigned_manager: staff[0]?.name || 'Unassigned',
        address: '123 Business Park Mumbai',
        special_instructions: 'Handle with care',
        points_to_remember: 'Old client',
        gst_work: 'Yes',
        tds_work: 'Yes',
        it_work: 'Yes',
        audit_work: 'No',
        roc_work: 'No',
        payroll_work: 'No',
        accounting_work: 'No'
      });
    } else if (type === 'staff') {
      worksheet.columns = [
        { header: 'Full Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Manager Name', key: 'manager_name', width: 25 },
        { header: 'Joining Date', key: 'joining_date', width: 20 },
      ];

      // Add Data Validation for Role (Column 3)
      const roles = 'Partner,Manager,paid_staff,article';
      for (let i = 2; i <= 101; i++) {
        worksheet.getRow(i).getCell(3).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${roles}"`],
        };
      }

      // Add sample data
      worksheet.addRow({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'paid_staff',
        phone: '+91 98765 43210',
        manager_name: staff[0]?.name || '',
        joining_date: '2024-01-15',
      });
    } else {
      worksheet.columns = [
        { header: 'Client Name', key: 'client_name', width: 30 },
        { header: 'Staff Name', key: 'staff_name', width: 25 },
        { header: 'Compliance Type', key: 'compliance_type', width: 25 },
        { header: 'Task Title', key: 'title', width: 40 },
        { header: 'Due Date (YYYY-MM-DD)', key: 'due_date', width: 25 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Period', key: 'period', width: 20 },
      ];

      // Prepare validation lists
      const clientNames = clients.map(c => c.name).join(',');
      const staffNames = staff.map(s => s.name).join(',');
      const compTypes = complianceTypes.map(ct => ct.name).join(',');
      const priorities = 'low,medium,high';

      // Apply validations to first 100 rows
      for (let i = 2; i <= 101; i++) {
        const row = worksheet.getRow(i);
        if (clientNames) {
          row.getCell(1).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${clientNames}"`] };
        }
        if (staffNames) {
          row.getCell(2).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${staffNames}"`] };
        }
        if (compTypes) {
          row.getCell(3).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${compTypes}"`] };
        }
        row.getCell(6).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${priorities}"`] };
      }

      // Add sample
      worksheet.addRow({
        client_name: clients[0]?.name || 'Sample Client',
        staff_name: staff[0]?.name || 'Sample Staff',
        compliance_type: complianceTypes[0]?.name || 'GST',
        title: 'Monthly Return Filing',
        due_date: '2024-04-20',
        priority: 'high',
        period: 'March 2024',
      });
    }

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${type}_template.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const parseXlsx = async (buffer: ArrayBuffer): Promise<any[]> => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const data: any[] = [];

    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      const headerText = cell.text.trim().toLowerCase();
      const sanitizedHeader = headerText
        .replace(/\s+/g, '_')
        .split('(')[0]
        .replace(/_$/, '');
      headers.push(sanitizedHeader);
    });

    console.log('[Import] Found headers:', headers);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: any = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (!header) return;

        let value = cell.value;
        // Handle formulae or rich text
        if (value && typeof value === 'object') {
          if ('result' in value) value = value.result;
          else if ('text' in value) value = (value as any).text;
          else if ('richText' in value) {
            value = (value as any).richText.map((rt: any) => rt.text).join('');
          }
        }

        // Clean values
        if (typeof value === 'string') {
          value = value.trim();
        } else if (value instanceof Date) {
          // Format date as YYYY-MM-DD
          value = value.toISOString().split('T')[0];
        }

        if (value !== null && value !== undefined && value !== '') {
          hasData = true;
        }

        const complianceKeywords = ['gst', 'tds', 'it', 'income_tax', 'audit', 'roc', 'payroll', 'accounting'];
        const isCompliance = type === 'clients' && (header.endsWith('_work') || complianceKeywords.includes(header));

        if (isCompliance) {
          const isYes = String(value || '').toLowerCase().startsWith('y');
          if (!rowData.work_types) rowData.work_types = [];
          if (isYes) {
            const key = header.replace('_work', '');
            const categoryMap: Record<string, string> = {
              'gst': 'GST',
              'tds': 'TDS',
              'it': 'Income Tax',
              'income_tax': 'Income Tax',
              'audit': 'Audit',
              'roc': 'ROC',
              'payroll': 'Payroll',
              'accounting': 'Accounting'
            };
            const mappedValue = categoryMap[key] || key.toUpperCase();
            if (!rowData.work_types.includes(mappedValue)) {
              rowData.work_types.push(mappedValue);
            }
          }
          // Still keep the original key for the service to check if needed
          rowData[header] = value;
        } else {
          rowData[header] = value;
        }
      });

      if (hasData) {
        // Skip sample data rows more robustly
        const name = String(rowData.full_name || rowData.name || '').trim().toLowerCase();
        const pan = String(rowData.pan || '').trim().toLowerCase();
        const email = String(rowData.email || '').trim().toLowerCase();

        if (
          (name === 'abc enterprises pvt ltd' && pan === 'abcde1234f') ||
          (email === 'contact@abc.com') ||
          (name === 'john doe' && email === 'john.doe@example.com')
        ) {
          console.log(`[Import] Skipping sample data row ${rowNumber}:`, name);
          return;
        }
        data.push(rowData);
      }
    });

    return data;
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const data = await parseXlsx(buffer);

      if (data.length === 0) {
        throw new Error('No valid data found in the file');
      }

      onImport(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Import {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700">
                  Download the Excel (.xlsx) template with formatting and validations
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop your Excel (.xlsx) file
                </p>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>

            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Import Data'}
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

export default ImportModal;