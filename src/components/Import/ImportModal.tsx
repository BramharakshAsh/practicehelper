import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  type: 'clients' | 'staff' | 'tasks';
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ type, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTemplateData = () => {
    switch (type) {
      case 'clients':
        return {
          filename: 'clients_template.csv',
          headers: ['name', 'pan', 'gstin', 'email', 'phone', 'address', 'gst_work', 'tds_work', 'it_work', 'roc_work', 'audit_work', 'accounting_work'],
          sample: [
            'ABC Enterprises Pvt Ltd,ABCDE1234F,29ABCDE1234F1Z5,contact@abc.com,+91 98765 43210,"123 Business Park Mumbai",Yes,Yes,Yes,No,No,Yes'
          ]
        };
      case 'staff':
        return {
          filename: 'staff_template.csv',
          headers: ['name', 'email', 'phone', 'role', 'is_active'],
          sample: [
            'John Doe,john@firm.com,+91 98765 12345,paid_staff,Yes'
          ]
        };
      case 'tasks':
        return {
          filename: 'tasks_template.csv',
          headers: ['client_name', 'staff_name', 'compliance_type', 'title', 'due_date', 'priority', 'period'],
          sample: [
            '"ABC Enterprises","John Doe","GST","GST Return - March 2024","2024-04-20","high","March 2024"'
          ]
        };
      default:
        return { filename: '', headers: [], sample: [] };
    }
  };

  const downloadTemplate = () => {
    const template = getTemplateData();
    const csvContent = [
      template.headers.join(','),
      ...template.sample
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Parse CSV properly handling quoted values
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (type === 'clients' && header.endsWith('_work')) {
          // Convert Yes/No to boolean and build work_types array
          const isYes = value.toLowerCase() === 'yes';
          if (!row.work_types) row.work_types = [];
          if (isYes) {
            const workType = header.replace('_work', '').toUpperCase();
            row.work_types.push(workType);
          }
        } else if (header === 'is_active' && type === 'staff') {
          row[header] = value.toLowerCase() === 'yes';
        } else {
          row[header] = value;
        }
      });
      
      // Clean up temporary work type fields for clients
      if (type === 'clients') {
        ['gst_work', 'tds_work', 'it_work', 'roc_work', 'audit_work', 'accounting_work'].forEach(field => {
          delete row[field];
        });
      }
      
      data.push(row);
    }
    
    return data;
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
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
                  Download the CSV template with the correct format and sample data
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop your CSV file
                </p>
                <input
                  type="file"
                  accept=".csv"
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