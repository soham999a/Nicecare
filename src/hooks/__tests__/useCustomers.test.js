import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  mockMasterUser,
  mockMasterProfile,
  mockMemberUser,
  mockMemberProfile,
} from '../../test/mocks/inventoryContexts';

const mockUnsubscribe = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

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
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: vi.fn((db, coll, id) => ({ id, collection: coll })),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}));

vi.mock('../../config/firebase', () => ({
  db: {},
}));

const mockUseInventoryAuth = vi.fn();
vi.mock('../../context/InventoryAuthContext', () => ({
  useInventoryAuth: () => mockUseInventoryAuth(),
}));

import { useCustomers } from '../useCustomers';

describe('useCustomers Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInventoryAuth.mockReturnValue({
      currentUser: mockMasterUser,
      userProfile: mockMasterProfile,
    });
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({ docs: [] });
      return mockUnsubscribe;
    });
  });

  describe('Initial state and auth', () => {
    it('should return customers and API after load', async () => {
      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customers).toEqual([]);
      expect(result.current.addCustomer).toBeDefined();
      expect(result.current.updateCustomer).toBeDefined();
      expect(result.current.updateCustomerStatus).toBeDefined();
      expect(result.current.deleteCustomer).toBeDefined();
    });

    it('should return empty when not authenticated', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.customers).toEqual([]);
    });
  });

  describe('Store scoping', () => {
    it('should accept storeId for master filter', async () => {
      const { result } = renderHook(() => useCustomers('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('should use assignedStoreId for member', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: mockMemberProfile,
      });
      mockOnSnapshot.mockImplementation((q, onNext) => {
        onNext({ docs: [] });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('should use assignedStoreId for manager', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'manager-uid-789', email: 'manager@store.com' },
        userProfile: {
          uid: 'manager-uid-789',
          role: 'manager',
          ownerUid: mockMasterUser.uid,
          assignedStoreId: 'store-123',
          assignedStoreName: 'Main Store',
        },
      });
      mockOnSnapshot.mockImplementation((q, onNext) => {
        onNext({ docs: [] });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  describe('addCustomer', () => {
    it('should add customer with storeId for master', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-id' });
      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addCustomer({
          name: 'Test',
          email: 't@t.com',
          storeId: 'store-123',
        });
      });

      expect(mockAddDoc).toHaveBeenCalled();
      const call = mockAddDoc.mock.calls[0][1];
      expect(call.ownerUid).toBe(mockMasterUser.uid);
      expect(call.storeId).toBe('store-123');
      expect(call.name).toBe('Test');
    });

    it('should throw when master omits storeId', async () => {
      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addCustomer({ name: 'Test', email: 't@t.com' });
        })
      ).rejects.toThrow(/Store is required/);
    });

    it('should use assignedStoreId for member when adding', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: mockMemberProfile,
      });
      mockOnSnapshot.mockImplementation((q, onNext) => {
        onNext({ docs: [] });
        return mockUnsubscribe;
      });
      mockAddDoc.mockResolvedValue({ id: 'new-id' });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addCustomer({ name: 'Test', email: 't@t.com' });
      });

      expect(mockAddDoc).toHaveBeenCalled();
      const call = mockAddDoc.mock.calls[0][1];
      expect(call.ownerUid).toBe(mockMemberProfile.ownerUid);
      expect(call.storeId).toBe(mockMemberProfile.assignedStoreId);
    });

    it('should use assignedStoreId for manager when adding', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'manager-uid-789', email: 'manager@store.com' },
        userProfile: {
          uid: 'manager-uid-789',
          role: 'manager',
          ownerUid: mockMasterUser.uid,
          assignedStoreId: 'store-123',
          assignedStoreName: 'Main Store',
        },
      });
      mockOnSnapshot.mockImplementation((q, onNext) => {
        onNext({ docs: [] });
        return mockUnsubscribe;
      });
      mockAddDoc.mockResolvedValue({ id: 'new-id' });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addCustomer({ name: 'Test', email: 't@t.com' });
      });

      expect(mockAddDoc).toHaveBeenCalled();
      const call = mockAddDoc.mock.calls[0][1];
      expect(call.ownerUid).toBe(mockMasterUser.uid);
      expect(call.storeId).toBe('store-123');
    });
  });
});
