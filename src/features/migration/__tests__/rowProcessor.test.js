import { describe, it, expect } from 'vitest';
import { processRow, processAllRows } from '../rowProcessor';

describe('rowProcessor', () => {
  describe('processRow', () => {
    describe('stores', () => {
      it('validates required name', () => {
        const result = processRow({ name: 'Store A' }, 'stores', 1);
        expect(result.valid).toBe(true);
        expect(result.doc.name).toBe('Store A');
      });

      it('fails when name is empty', () => {
        const result = processRow({ name: '' }, 'stores', 1);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Row 1: Store Name is required');
      });

      it('coerces optional fields', () => {
        const result = processRow(
          { name: 'Store B', address: ' 123 Main ', phone: '555-1234' },
          'stores',
          2
        );
        expect(result.valid).toBe(true);
        expect(result.doc.address).toBe('123 Main');
        expect(result.doc.phone).toBe('555-1234');
      });
    });

    describe('products', () => {
      it('validates required name and storeId', () => {
        const result = processRow(
          { name: 'Widget', storeId: 'store123' },
          'products',
          1
        );
        expect(result.valid).toBe(true);
        expect(result.doc.name).toBe('Widget');
        expect(result.doc.storeId).toBe('store123');
      });

      it('coerces numeric fields with defaults', () => {
        const result = processRow(
          { name: 'Item', storeId: 's1', price: '10.99', quantity: '5', cost: '' },
          'products',
          1
        );
        expect(result.valid).toBe(true);
        expect(result.doc.price).toBe(10.99);
        expect(result.doc.quantity).toBe(5);
        expect(result.doc.cost).toBe(0);
      });

      it('fails on negative price', () => {
        const result = processRow(
          { name: 'X', storeId: 's1', price: '-5' },
          'products',
          1
        );
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('Price'))).toBe(true);
      });

      it('accepts storeName when storeId is empty', () => {
        const result = processRow(
          { name: 'Widget', storeName: 'Main Street Store' },
          'products',
          1
        );
        expect(result.valid).toBe(true);
        expect(result.doc.storeName).toBe('Main Street Store');
      });

      it('fails when neither storeId nor storeName is provided', () => {
        const result = processRow({ name: 'Widget' }, 'products', 1);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('Store ID or Store Name'))).toBe(true);
      });
    });

    describe('employees', () => {
      it('validates required displayName, email, assignedStoreId', () => {
        const result = processRow(
          {
            displayName: 'Jane Doe',
            email: 'jane@example.com',
            assignedStoreId: 'store1',
          },
          'employees',
          1
        );
        expect(result.valid).toBe(true);
        expect(result.doc.displayName).toBe('Jane Doe');
      });

      it('fails when displayName is missing', () => {
        const result = processRow(
          { email: 'j@x.com', assignedStoreId: 's1' },
          'employees',
          1
        );
        expect(result.valid).toBe(false);
      });

      it('accepts assignedStoreName when assignedStoreId is empty', () => {
        const result = processRow(
          { displayName: 'Jane', email: 'j@x.com', assignedStoreName: 'Main Store' },
          'employees',
          1
        );
        expect(result.valid).toBe(true);
        expect(result.doc.assignedStoreName).toBe('Main Store');
      });

      it('fails when neither assignedStoreId nor assignedStoreName is provided', () => {
        const result = processRow(
          { displayName: 'Jane', email: 'j@x.com' },
          'employees',
          1
        );
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('Assigned Store ID or Assigned Store Name'))).toBe(true);
      });
    });

    describe('customers', () => {
      it('requires name, storeId, submissionDate, status', () => {
        const result = processRow(
          {
            name: 'Customer A',
            storeId: 's1',
            submissionDate: '2024-01-15',
            status: 'Device Received',
            phone: '555-0000',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(true);
      });

      it('accepts storeName when storeId is empty', () => {
        const result = processRow(
          {
            name: 'Customer A',
            storeName: 'Main Store',
            submissionDate: '2024-01-15',
            status: 'Device Received',
            phone: '555-0000',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(true);
        expect(result.doc.storeName).toBe('Main Store');
      });

      it('fails when neither storeId nor storeName is provided', () => {
        const result = processRow(
          {
            name: 'Customer A',
            submissionDate: '2024-01-15',
            status: 'Device Received',
            phone: '555-0000',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('Store ID or Store Name'))).toBe(true);
      });

      it('requires either email or phone', () => {
        const result = processRow(
          {
            name: 'C',
            storeId: 's1',
            submissionDate: '2024-01-15',
            status: 'Device Received',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('email') || e.includes('phone'))).toBe(true);
      });

      it('rejects status "Select"', () => {
        const result = processRow(
          {
            name: 'C',
            storeId: 's1',
            submissionDate: '2024-01-15',
            status: 'Select',
            email: 'c@x.com',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(false);
      });

      it('rejects future submission date', () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        const futureStr = future.toISOString().slice(0, 10);
        const result = processRow(
          {
            name: 'C',
            storeId: 's1',
            submissionDate: futureStr,
            status: 'Device Received',
            email: 'c@x.com',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(false);
      });

      it('rejects IMEI that is not 15 digits', () => {
        const result = processRow(
          {
            name: 'C',
            storeId: 's1',
            submissionDate: '2024-01-15',
            status: 'Device Received',
            email: 'c@x.com',
            imei: '123',
          },
          'customers',
          1
        );
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('processAllRows', () => {
    it('splits valid and invalid rows', () => {
      const rows = [
        { name: 'Store 1' },
        { name: '' },
        { name: 'Store 2' },
      ];
      const mapping = { name: 'name' };
      const result = processAllRows(rows, mapping, 'stores');
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].rowIndex).toBe(3);
    });
  });
});
