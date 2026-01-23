import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock Firebase Firestore functions
const mockUnsubscribe = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: (...args) => {
    mockOnSnapshot(...args);
    return mockUnsubscribe;
  },
  addDoc: (...args) => mockAddDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  doc: vi.fn((db, collection, id) => ({ id, collection })),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    fromDate: (date) => ({ toDate: () => date }),
  },
  getFirestore: vi.fn(() => ({})),
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

// Mock useInventoryAuth
const mockUseInventoryAuth = vi.fn();
vi.mock('../../context/InventoryAuthContext', () => ({
  useInventoryAuth: () => mockUseInventoryAuth(),
}));

import { useSales } from '../useSales';
import {
  mockMasterUser,
  mockMasterProfile,
  mockMemberUser,
  mockMemberProfile,
  mockSales,
} from '../../test/mocks/inventoryContexts';

describe('useSales Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInventoryAuth.mockReturnValue({
      currentUser: mockMasterUser,
      userProfile: mockMasterProfile,
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { result } = renderHook(() => useSales());

      expect(result.current.loading).toBe(true);
      expect(result.current.sales).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should return empty sales if user is not authenticated', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useSales());

      expect(result.current.sales).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Fetching Sales - Master User', () => {
    it('should fetch all sales for master user', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockSales.map(sale => ({
            id: sale.id,
            data: () => sale,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sales).toHaveLength(2);
    });

    it('should filter sales by store for master user', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockSales.map(sale => ({
            id: sale.id,
            data: () => sale,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useSales('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sales.every(s => s.storeId === 'store-123')).toBe(true);
    });
  });

  describe('Fetching Sales - Member User', () => {
    beforeEach(() => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: mockMemberProfile,
      });
    });

    it('should fetch only assigned store sales for member', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockSales.map(sale => ({
            id: sale.id,
            data: () => sale,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sales.every(s => s.storeId === 'store-123')).toBe(true);
    });

    it('should return empty if member has no assigned store', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: { ...mockMemberProfile, assignedStoreId: null },
      });

      const { result } = renderHook(() => useSales());

      expect(result.current.sales).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Sales Statistics', () => {
    it('should calculate stats correctly', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockSales.map(sale => ({
            id: sale.id,
            data: () => sale,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.totalSales).toBe(2);
      expect(result.current.stats.totalRevenue).toBe(2699.96); // 1199.99 + 1499.97
    });
  });

  describe('Creating Sales', () => {
    it('should create a new sale for master user', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockAddDoc.mockResolvedValue({ id: 'new-sale-id' });

      const { result } = renderHook(() => useSales());

      const newSale = {
        storeId: 'store-123',
        items: [
          {
            productId: 'product-1',
            productName: 'iPhone 16 Pro Max',
            price: 1199.99,
            quantity: 1,
            subtotal: 1199.99,
          },
        ],
        subtotal: 1199.99,
        tax: 0,
        total: 1199.99,
        paymentMethod: 'Cash',
        customerName: 'Test Customer',
      };

      let saleId;
      await act(async () => {
        saleId = await result.current.createSale(newSale);
      });

      expect(saleId).toBe('new-sale-id');
      expect(mockAddDoc).toHaveBeenCalled();
      // Verify the data object passed to addDoc (second argument)
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        storeId: 'store-123',
        total: 1199.99,
        ownerUid: 'master-uid-123',
        status: 'completed',
      });
    });

    it('should create a new sale for member user with correct ownerUid', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: mockMemberProfile,
      });
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockAddDoc.mockResolvedValue({ id: 'new-sale-id' });

      const { result } = renderHook(() => useSales());

      const newSale = {
        storeId: 'store-123',
        items: [
          {
            productId: 'product-1',
            productName: 'iPhone 16 Pro Max',
            price: 1199.99,
            quantity: 1,
            subtotal: 1199.99,
          },
        ],
        subtotal: 1199.99,
        tax: 0,
        total: 1199.99,
        paymentMethod: 'Cash',
      };

      await act(async () => {
        await result.current.createSale(newSale);
      });

      // Should use the master's UID (ownerUid from member profile), not the member's UID
      expect(mockAddDoc).toHaveBeenCalled();
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        ownerUid: 'master-uid-123', // ownerUid from mockMemberProfile
        employeeId: 'member-uid-456',
      });
    });

    it('should throw error when not authenticated', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useSales());

      await expect(
        result.current.createSale({ total: 100 })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Sales Reports', () => {
    it('should generate sales report with correct calculations', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockGetDocs.mockResolvedValue({
        docs: mockSales.map(sale => ({
          id: sale.id,
          data: () => sale,
        })),
      });

      const { result } = renderHook(() => useSales());

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      let report;
      await act(async () => {
        report = await result.current.getSalesReport(startDate, endDate);
      });

      expect(report.totalSales).toBe(2);
      expect(report.totalRevenue).toBe(2699.96);
      expect(report.averageOrderValue).toBeCloseTo(1349.98, 2);
      expect(report.paymentMethodBreakdown).toHaveProperty('Card');
      expect(report.paymentMethodBreakdown).toHaveProperty('Cash');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      const mockError = new Error('Firebase error');
      mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(mockError);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load sales');
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { unmount } = renderHook(() => useSales());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
