/**
 * Unified file parser for CSV and Excel (.xlsx, .xls) import.
 * Returns a consistent shape: { headers, rows, raw } for downstream mapping/validation.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseCSVFile } from './csvParser';

const EXCEL_EXTENSIONS = /\.(xlsx|xls)$/i;
const CSV_EXTENSION = /\.csv$/i;

/**
 * Convert a cell value to string for consistency with CSV (where all values are strings).
 * @param {*} value
 * @returns {string}
 */
function cellToString(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object' && value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

/**
 * Parse an Excel file (.xlsx or .xls) and return headers + rows.
 * Uses the first worksheet. Normalizes all values to strings for consistency with CSV.
 * @param {File} file - Excel file from input
 * @returns {Promise<{ headers: string[]; rows: Record<string, string>[]; raw: string[][] }>}
 */
export function parseExcelFile(file) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel file has no worksheets');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

    if (data.length === 0) {
      return { headers: [], rows: [], raw: [] };
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((row) => {
      const out = {};
      for (const h of headers) {
        out[h] = cellToString(row[h]);
      }
      return out;
    });
    const raw = rows.map((row) => headers.map((h) => row[h] ?? ''));

    return { headers, rows, raw };
  });
}

/**
 * Parse all sheets from an Excel workbook.
 * @param {File} file - Excel file from input
 * @returns {Promise<{ sheets: { sheetName: string; headers: string[]; rows: Record<string, string>[]; raw: string[][] }[] }>}
 */
export function parseExcelWorkbook(file) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames || [];
    if (sheetNames.length === 0) {
      throw new Error('Excel file has no worksheets');
    }

    const sheets = sheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (data.length === 0) {
        return { sheetName, headers: [], rows: [], raw: [] };
      }

      const headers = Object.keys(data[0]);
      const rows = data.map((row) => {
        const out = {};
        for (const h of headers) {
          out[h] = cellToString(row[h]);
        }
        return out;
      });
      const raw = rows.map((row) => headers.map((h) => row[h] ?? ''));

      return { sheetName, headers, rows, raw };
    });

    return { sheets };
  });
}

/**
 * Parse a file (CSV or Excel) and return headers + rows.
 * Detects format by file extension.
 * @param {File} file - File from input
 * @returns {Promise<{ headers: string[]; rows: Record<string, string>[]; raw: string[][] }>}
 */
export async function parseImportFile(file) {
  const name = file.name || '';
  if (EXCEL_EXTENSIONS.test(name)) {
    return parseExcelFile(file);
  }
  if (CSV_EXTENSION.test(name)) {
    return parseCSVFile(file);
  }
  throw new Error('Unsupported file type. Use .csv, .xlsx, or .xls');
}
