"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";

interface SpreadsheetEditorProps {
  headers: string[];
  initialData: any[][];
  onDataChange: (data: any[][]) => void;
  onSave: () => void;
}

export function SpreadsheetEditor({
  headers,
  initialData,
  onDataChange,
  onSave,
}: SpreadsheetEditorProps) {
  const [data, setData] = useState<any[][]>(initialData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleCellClick = (row: number, col: number) => {
    const currentValue = data[row]?.[col] ?? "";
    setEditingCell({ row, col });
    setEditingValue(String(currentValue));
  };

  const handleCellBlur = () => {
    if (editingCell === null) return;

    const { row, col } = editingCell;
    const newData = [...data];
    
    // Ensure row exists
    if (!newData[row]) {
      newData[row] = new Array(headers.length).fill("");
    }
    
    // Update cell value
    newData[row][col] = editingValue;
    
    setData(newData);
    onDataChange(newData);
    setEditingCell(null);
    setEditingValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell === null) return;

    if (e.key === "Enter") {
      e.preventDefault();
      handleCellBlur();
      // Move to next row
      if (editingCell.row < data.length - 1) {
        handleCellClick(editingCell.row + 1, editingCell.col);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleCellBlur();
      // Move to next column or next row
      if (editingCell.col < headers.length - 1) {
        handleCellClick(editingCell.row, editingCell.col + 1);
      } else if (editingCell.row < data.length - 1) {
        handleCellClick(editingCell.row + 1, 0);
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditingValue("");
    }
  };

  const handleAddRow = () => {
    const newRow = new Array(headers.length).fill("");
    const newData = [...data, newRow];
    setData(newData);
    onDataChange(newData);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    setData(newData);
    onDataChange(newData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Edit Data</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
          >
            <Plus size={14} />
            Add Row
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="border border-slate-600/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table ref={tableRef} className="w-full border-collapse bg-slate-800">
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-2 py-2 text-xs font-medium text-gray-300 border border-slate-600/50">
                  #
                </th>
                {headers.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="px-3 py-2 text-xs font-medium text-gray-300 border border-slate-600/50 min-w-[120px]"
                  >
                    {header || `Column ${colIndex + 1}`}
                  </th>
                ))}
                <th className="w-12 px-2 py-2 text-xs font-medium text-gray-300 border border-slate-600/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-700/30">
                  <td className="px-2 py-2 text-xs text-gray-400 border border-slate-600/50 text-center">
                    {rowIndex + 1}
                  </td>
                  {headers.map((_, colIndex) => {
                    const isEditing =
                      editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const cellValue = row[colIndex] ?? "";

                    return (
                      <td
                        key={colIndex}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className="px-3 py-2 text-sm border border-slate-600/50 cursor-cell relative"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 bg-slate-900 border border-blue-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-300">{String(cellValue)}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 border border-slate-600/50 text-center">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={headers.length + 2}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    No data. Click "Add Row" to start adding data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
