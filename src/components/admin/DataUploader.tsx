"use client";

import React, { useRef } from "react";
import { Upload, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface DataUploaderProps {
  onDataLoaded: (data: any[][], headers: string[]) => void;
  onError: (error: string) => void;
}

export function DataUploader({ onDataLoaded, onError }: DataUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    // Handle Excel files (.xlsx, .xls)
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
          
          if (jsonData.length === 0) {
            onError("The file appears to be empty.");
            return;
          }

          // First row is headers
          const headers = (jsonData[0] || []).map((h: any) => String(h || ''));
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

          onDataLoaded(rows, headers);
        } catch (error) {
          onError(`Error reading Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Handle CSV files
    else if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as any[][];
            
            if (data.length === 0) {
              onError("The file appears to be empty.");
              return;
            }

            // First row is headers
            const headers = (data[0] || []).map((h: any) => String(h || ''));
            const rows = data.slice(1).filter(row => row.some(cell => cell !== ''));

            onDataLoaded(rows, headers);
          } catch (error) {
            onError(`Error reading CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },
        error: (error) => {
          onError(`Error parsing CSV: ${error.message}`);
        },
      });
    } else {
      onError("Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Upload Raw Data File
      </label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-slate-500 transition-colors bg-slate-800/30"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-sm text-gray-300 mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          Supports Excel (.xlsx, .xls) and CSV (.csv) files
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <FileSpreadsheet size={14} />
            Excel
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <FileText size={14} />
            CSV
          </div>
        </div>
      </div>
    </div>
  );
}
