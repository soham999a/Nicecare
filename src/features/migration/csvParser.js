/**
 * CSV parsing utilities using papaparse.
 */

import Papa from 'papaparse';

/**
 * Parse a CSV file and return headers + rows.
 * @param {File} file - CSV file from input
 * @returns {Promise<{ headers: string[]; rows: Record<string, string>[]; raw: string[][] }>}
 */
export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        if (result.errors.length > 0) {
          const first = result.errors[0];
          reject(new Error(first.message || 'CSV parse error'));
          return;
        }
        const data = result.data;
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        resolve({
          headers,
          rows: data,
          raw: result.data.map((row) => headers.map((h) => row[h] ?? '')),
        });
      },
      error(err) {
        reject(err);
      },
    });
  });
}
