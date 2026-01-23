import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock Firebase Firestore functions
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
  doc: vi.fn((db, collection, id) => ({ id, collection })),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
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

import { useStores } from '../useStores';
import {
  mockMasterUser,
  mockMasterProfile,
  mockStores,
} from '../../test/mocks/inventoryContexts';

describe('useStores Hook', () => {
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
      
      const { result } = renderHook(() => useStores());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.stores).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should return empty stores if user is not authenticated', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useStores());

      expect(result.current.stores).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should return empty stores if user is not a master', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'test-uid' },
        userProfile: { role: 'member' },
      });

      const { result } = renderHook(() => useStores());

      expect(result.current.stores).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Fetching Stores', () => {
    it('should fetch stores successfully', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockStores.map(store => ({
            id: store.id,
            data: () => store,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useStores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stores).toHaveLength(2);
      expect(result.current.stores[0].name).toBe('Main Store');
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Firebase error');
      mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(mockError);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useStores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load stores');
      expect(result.current.stores).toEqual([]);
    });

    it('should unsubscribe on unmount', () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { unmount } = renderHook(() => useStores());
      
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Adding Stores', () => {
    it('should add a new store', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockAddDoc.mockResolvedValue({ id: 'new-store-id' });

      const { result } = renderHook(() => useStores());

      const newStore = {
        name: 'New Store',
        address: '789 New St',
        phone: '555-0300',
      };

      let storeId;
      await act(async () => {
        storeId = await result.current.addStore(newStore);
      });

      expect(storeId).toBe('new-store-id');
      expect(mockAddDoc).toHaveBeenCalled();
      // Verify the data object passed to addDoc (second argument)
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        name: 'New Store',
        address: '789 New St',
        phone: '555-0300',
        ownerUid: 'master-uid-123',
        employeeCount: 0,
        productCount: 0,
      });
    });

    it('should throw error when not authenticated', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useStores());

      await expect(
        result.current.addStore({ name: 'Test' })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Updating Stores', () => {
    it('should update a store', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useStores());

      await act(async () => {
        await result.current.updateStore('store-123', {
          name: 'Updated Store Name',
        });
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'store-123' }),
        expect.objectContaining({
          name: 'Updated Store Name',
        })
      );
    });
  });

  describe('Deleting Stores', () => {
    it('should delete a store', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockDeleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useStores());

      await act(async () => {
        await result.current.deleteStore('store-123');
      });

      expect(mockDeleteDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'store-123' })
      );
    });
  });
});
