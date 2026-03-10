import { describe, it, expect, vi } from 'vitest';
import { parseCSVFile } from '../csvParser';

// Mock Papa since we can't easily create File in Node
vi.mock('papaparse', () => ({
  default: {
    parse: (source, options) => {
      if (source instanceof File) {
        const reader = new FileReader();
        let result;
        reader.onload = () => {
          const text = reader.result;
          const lines = text.split('\n').filter(Boolean);
          const headers = lines[0]?.split(',') ?? [];
          const data = lines.slice(1).map((line) => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((h, i) => {
              obj[h.trim()] = values[i]?.trim() ?? '';
            });
            return obj;
          });
          result = {
            data,
            errors: [],
          };
          options.complete?.(result);
        };
        reader.readAsText(source);
        return;
      }
      options.complete?.({ data: [], errors: [] });
    },
  },
}));

describe('csvParser', () => {
  it('parseCSVFile returns headers and rows', async () => {
    const csv = 'name,address\nStore A,123 Main\nStore B,456 Oak';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseCSVFile(file);
    expect(result.headers).toEqual(['name', 'address']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: 'Store A', address: '123 Main' });
    expect(result.rows[1]).toEqual({ name: 'Store B', address: '456 Oak' });
  });

  it('handles empty file', async () => {
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    const result = await parseCSVFile(file);
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});
