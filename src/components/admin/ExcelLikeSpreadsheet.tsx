"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Copy, Scissors, Clipboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface ExcelLikeSpreadsheetProps {
  headers: string[];
  initialData: any[][];
  onDataChange: (data: any[][]) => void;
  onSave: () => void;
}

interface CellSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function ExcelLikeSpreadsheet({
  headers,
  initialData,
  onDataChange,
  onSave,
}: ExcelLikeSpreadsheetProps) {
  const [data, setData] = useState<any[][]>(initialData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [selectedCells, setSelectedCells] = useState<CellSelection | null>(null);
  const [clipboard, setClipboard] = useState<any[][] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Handle cell click
  const handleCellClick = (row: number, col: number, e?: React.MouseEvent) => {
    if (e?.shiftKey && selectedCells) {
      // Extend selection
      setSelectedCells({
        startRow: selectedCells.startRow,
        startCol: selectedCells.startCol,
        endRow: row,
        endCol: col,
      });
    } else {
      // New selection
      setSelectedCells({
        startRow: row,
        startCol: col,
        endRow: row,
        endCol: col,
      });
      const currentValue = data[row]?.[col] ?? "";
      setEditingCell({ row, col });
      setEditingValue(String(currentValue));
    }
  };

  // Handle cell double-click to edit
  const handleCellDoubleClick = (row: number, col: number) => {
    const currentValue = data[row]?.[col] ?? "";
    setEditingCell({ row, col });
    setEditingValue(String(currentValue));
    setSelectedCells({
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    });
  };

  // Handle cell blur
  const handleCellBlur = () => {
    if (editingCell === null) return;

    const { row, col } = editingCell;
    const newData = [...data];
    
    // Ensure row exists
    if (!newData[row]) {
      newData[row] = new Array(headers.length).fill("");
    }
    
    // Process formula if starts with =
    let processedValue = editingValue;
    if (editingValue.startsWith("=")) {
      try {
        processedValue = evaluateFormula(editingValue, newData, row, col);
      } catch (error) {
        console.error("Formula error:", error);
        // Keep original value if formula fails
      }
    }
    
    // Update cell value
    newData[row][col] = processedValue;
    
    setData(newData);
    onDataChange(newData);
    setEditingCell(null);
    setEditingValue("");
  };

  // Basic formula evaluation
  const evaluateFormula = (formula: string, data: any[][], currentRow: number, currentCol: number): string => {
    // Remove = sign
    let expression = formula.substring(1).trim();
    
    // Replace cell references (e.g., A1, B2) with values
    expression = expression.replace(/([A-Z]+)(\d+)/g, (match, colLetter, rowNum) => {
      const colIndex = colLetterToIndex(colLetter);
      const rowIndex = parseInt(rowNum) - 1;
      const cellValue = data[rowIndex]?.[colIndex] ?? 0;
      const numValue = isNaN(Number(cellValue)) ? 0 : Number(cellValue);
      return String(numValue);
    });
    
    // Evaluate basic math expressions
    try {
      // Only allow safe math operations
      const result = Function(`"use strict"; return (${expression})`)();
      return String(result);
    } catch (error) {
      return formula; // Return original if evaluation fails
    }
  };

  // Convert column letter to index (A=0, B=1, etc.)
  const colLetterToIndex = (letters: string): number => {
    let index = 0;
    for (let i = 0; i < letters.length; i++) {
      index = index * 26 + (letters.charCodeAt(i) - 64);
    }
    return index - 1;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell === null) return;

    const { row, col } = editingCell;

    // Handle Enter
    if (e.key === "Enter") {
      e.preventDefault();
      handleCellBlur();
      // Move to next row
      if (row < data.length - 1) {
        handleCellClick(row + 1, col);
      } else {
        // Add new row if at end
        handleAddRow();
        handleCellClick(data.length, col);
      }
    }
    // Handle Tab
    else if (e.key === "Tab") {
      e.preventDefault();
      handleCellBlur();
      if (e.shiftKey) {
        // Move to previous column
        if (col > 0) {
          handleCellClick(row, col - 1);
        }
      } else {
        // Move to next column or next row
        if (col < headers.length - 1) {
          handleCellClick(row, col + 1);
        } else if (row < data.length - 1) {
          handleCellClick(row + 1, 0);
        }
      }
    }
    // Handle Escape
    else if (e.key === "Escape") {
      setEditingCell(null);
      setEditingValue("");
    }
    // Handle Arrow keys (when not editing)
    else if (!editingCell && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      let newRow = row;
      let newCol = col;
      
      if (e.key === "ArrowUp" && row > 0) newRow = row - 1;
      if (e.key === "ArrowDown" && row < data.length - 1) newRow = row + 1;
      if (e.key === "ArrowLeft" && col > 0) newCol = col - 1;
      if (e.key === "ArrowRight" && col < headers.length - 1) newCol = col + 1;
      
      handleCellClick(newRow, newCol);
    }
    // Handle Copy (Ctrl+C)
    else if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      handleCopy();
    }
    // Handle Paste (Ctrl+V)
    else if (e.ctrlKey && e.key === "v") {
      e.preventDefault();
      handlePaste();
    }
    // Handle Cut (Ctrl+X)
    else if (e.ctrlKey && e.key === "x") {
      e.preventDefault();
      handleCut();
    }
  };

  // Copy selected cells
  const handleCopy = () => {
    if (!selectedCells) return;
    
    const { startRow, startCol, endRow, endCol } = selectedCells;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    const copiedData: any[][] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row: any[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        row.push(data[r]?.[c] ?? "");
      }
      copiedData.push(row);
    }
    
    setClipboard(copiedData);
    
    // Also copy to system clipboard
    const text = copiedData.map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text).catch(console.error);
  };

  // Cut selected cells
  const handleCut = () => {
    handleCopy();
    if (!selectedCells) return;
    
    const { startRow, startCol, endRow, endCol } = selectedCells;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    const newData = [...data];
    for (let r = minRow; r <= maxRow; r++) {
      if (!newData[r]) continue;
      for (let c = minCol; c <= maxCol; c++) {
        newData[r][c] = "";
      }
    }
    
    setData(newData);
    onDataChange(newData);
  };

  // Paste clipboard data
  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) {
      // Try to paste from system clipboard
      navigator.clipboard.readText().then(text => {
        const rows = text.split("\n").map(row => row.split("\t"));
        pasteData(rows);
      }).catch(console.error);
      return;
    }
    
    pasteData(clipboard);
  };

  const pasteData = (pastedData: any[][]) => {
    if (!selectedCells || pastedData.length === 0) return;
    
    const { startRow, startCol } = selectedCells;
    const newData = [...data];
    
    for (let r = 0; r < pastedData.length; r++) {
      const targetRow = startRow + r;
      if (!newData[targetRow]) {
        newData[targetRow] = new Array(headers.length).fill("");
      }
      
      for (let c = 0; c < pastedData[r].length; c++) {
        const targetCol = startCol + c;
        if (targetCol < headers.length) {
          newData[targetRow][targetCol] = pastedData[r][c];
        }
      }
    }
    
    setData(newData);
    onDataChange(newData);
  };

  // Drag to fill (fill handle)
  const handleDragStart = (row: number, col: number) => {
    setIsDragging(true);
  };

  const handleDragEnd = (targetRow: number, targetCol: number) => {
    if (!selectedCells || !isDragging) {
      setIsDragging(false);
      return;
    }
    
    const { startRow, startCol } = selectedCells;
    const sourceValue = data[startRow]?.[startCol] ?? "";
    
    // Calculate increment if numeric
    const isNumeric = !isNaN(Number(sourceValue));
    let increment = 0;
    if (isNumeric) {
      increment = Number(sourceValue);
    }
    
    const newData = [...data];
    const rowDiff = targetRow - startRow;
    const colDiff = targetCol - startCol;
    
    // Fill cells
    for (let r = startRow; r <= targetRow; r++) {
      if (!newData[r]) {
        newData[r] = new Array(headers.length).fill("");
      }
      for (let c = startCol; c <= targetCol; c++) {
        if (isNumeric) {
          const step = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
          newData[r][c] = increment + (r - startRow + c - startCol);
        } else {
          newData[r][c] = sourceValue;
        }
      }
    }
    
    setData(newData);
    onDataChange(newData);
    setIsDragging(false);
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

  const handleAddColumn = () => {
    const newData = data.map(row => [...row, ""]);
    onDataChange(newData);
    setData(newData);
  };

  // Check if cell is selected
  const isCellSelected = (row: number, col: number): boolean => {
    if (!selectedCells) return false;
    const { startRow, startCol, endRow, endCol } = selectedCells;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  // Get cell reference (A1, B2, etc.)
  const getCellReference = (row: number, col: number): string => {
    const colLetter = String.fromCharCode(65 + col);
    return `${colLetter}${row + 1}`;
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-600/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!selectedCells}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy (Ctrl+C)"
          >
            <Copy size={14} />
            Copy
          </button>
          <button
            onClick={handleCut}
            disabled={!selectedCells}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cut (Ctrl+X)"
          >
            <Scissors size={14} />
            Cut
          </button>
          <button
            onClick={handlePaste}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm"
            title="Paste (Ctrl+V)"
          >
            <Clipboard size={14} />
            Paste
          </button>
        </div>
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
            Save
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      {editingCell && (
        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-600/50">
          <span className="text-sm text-gray-400 font-mono min-w-[60px]">
            {getCellReference(editingCell.row, editingCell.col)}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 bg-slate-900 border border-blue-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter value or formula (e.g., =A1+B1)"
            autoFocus
          />
        </div>
      )}

      {/* Spreadsheet */}
      <div className="border border-slate-600/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table ref={tableRef} className="w-full border-collapse bg-slate-800 select-none">
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-2 py-2 text-xs font-medium text-gray-300 border border-slate-600/50 bg-slate-700">
                  #
                </th>
                {headers.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="px-3 py-2 text-xs font-medium text-gray-300 border border-slate-600/50 min-w-[120px] bg-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span>{header || `Column ${colIndex + 1}`}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {String.fromCharCode(65 + colIndex)}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="w-12 px-2 py-2 text-xs font-medium text-gray-300 border border-slate-600/50 bg-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-700/20">
                  <td className="px-2 py-2 text-xs text-gray-400 border border-slate-600/50 text-center bg-slate-700/50">
                    {rowIndex + 1}
                  </td>
                  {headers.map((_, colIndex) => {
                    const isEditing =
                      editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const cellValue = row[colIndex] ?? "";

                    return (
                      <td
                        key={colIndex}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                        className={`px-3 py-2 text-sm border border-slate-600/50 cursor-cell relative ${
                          isSelected
                            ? "bg-blue-500/30 ring-2 ring-blue-400"
                            : "bg-slate-800 hover:bg-slate-700/50"
                        }`}
                        title={getCellReference(rowIndex, colIndex)}
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
                          <span className={`text-gray-300 ${cellValue.toString().startsWith("=") ? "text-blue-400" : ""}`}>
                            {String(cellValue)}
                          </span>
                        )}
                        {/* Fill handle */}
                        {isSelected && editingCell?.row === rowIndex && editingCell?.col === colIndex && (
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-crosshair"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleDragStart(rowIndex, colIndex);
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 border border-slate-600/50 text-center bg-slate-700/50">
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
