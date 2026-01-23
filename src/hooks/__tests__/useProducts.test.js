import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock Firebase Firestore functions
const mockUnsubscribe = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();

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
  getDoc: (...args) => mockGetDoc(...args),
  doc: vi.fn((db, collection, id) => ({ id, collection })),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
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

import { useProducts } from '../useProducts';
import {
  mockMasterUser,
  mockMasterProfile,
  mockMemberUser,
  mockMemberProfile,
  mockProducts,
} from '../../test/mocks/inventoryContexts';

describe('useProducts Hook', () => {
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

      const { result } = renderHook(() => useProducts());

      expect(result.current.loading).toBe(true);
      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should return empty products if user is not authenticated', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useProducts());

      expect(result.current.products).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Fetching Products - Master User', () => {
    it('should fetch all products for master user', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockProducts.map(product => ({
            id: product.id,
            data: () => product,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toHaveLength(3);
      expect(result.current.products[0].name).toBe('iPhone 16 Pro Max');
    });

    it('should filter products by store for master user', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockProducts
            .filter(p => p.storeId === 'store-123')
            .map(product => ({
              id: product.id,
              data: () => product,
            })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useProducts('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products.every(p => p.storeId === 'store-123')).toBe(true);
    });
  });

  describe('Fetching Products - Member User', () => {
    beforeEach(() => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: mockMemberProfile,
      });
    });

    it('should fetch only assigned store products for member', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockProducts
            .filter(p => p.storeId === 'store-123')
            .map(product => ({
              id: product.id,
              data: () => product,
            })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products.every(p => p.storeId === 'store-123')).toBe(true);
    });

    it('should return empty if member has no assigned store', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: mockMemberUser,
        userProfile: { ...mockMemberProfile, assignedStoreId: null },
      });

      const { result } = renderHook(() => useProducts());

      expect(result.current.products).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Low Stock Detection', () => {
    it('should identify low stock products', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockProducts.map(product => ({
            id: product.id,
            data: () => product,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // AirPods Pro 3 has quantity 3 and threshold 10, so it's low stock
      expect(result.current.lowStockProducts).toHaveLength(1);
      expect(result.current.lowStockProducts[0].name).toBe('AirPods Pro 3');
    });
  });

  describe('Adding Products', () => {
    it('should add a new product', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockAddDoc.mockResolvedValue({ id: 'new-product-id' });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ productCount: 5 }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProducts());

      const newProduct = {
        name: 'New Phone',
        sku: 'NEW-001',
        price: 599.99,
        cost: 400,
        quantity: 10,
        storeId: 'store-123',
      };

      let productId;
      await act(async () => {
        productId = await result.current.addProduct(newProduct);
      });

      expect(productId).toBe('new-product-id');
      expect(mockAddDoc).toHaveBeenCalled();
      // Verify the data object passed to addDoc (second argument)
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        name: 'New Phone',
        sku: 'NEW-001',
        price: 599.99,
        ownerUid: 'master-uid-123',
      });
    });

    it('should throw error when not authenticated', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
      });

      const { result } = renderHook(() => useProducts());

      await expect(
        result.current.addProduct({ name: 'Test' })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Updating Products', () => {
    it('should update product details', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ storeId: 'store-123' }),
      });

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.updateProduct('product-1', {
          name: 'Updated Product Name',
          price: 1299.99,
        });
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('Stock Management', () => {
    it('should update stock and create movement record', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'iPhone 16 Pro Max',
          quantity: 25,
          storeId: 'store-123',
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'movement-id' });

      const { result } = renderHook(() => useProducts());

      let newQuantity;
      await act(async () => {
        newQuantity = await result.current.updateStock('product-1', -5, 'Sale');
      });

      expect(newQuantity).toBe(20);
      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
      // Verify the stock movement data
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        productId: 'product-1',
        change: -5,
        reason: 'Sale',
      });
    });

    it('should not allow negative stock', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'Test Product',
          quantity: 5,
          storeId: 'store-123',
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'movement-id' });

      const { result } = renderHook(() => useProducts());

      let newQuantity;
      await act(async () => {
        newQuantity = await result.current.updateStock('product-1', -10, 'Sale');
      });

      expect(newQuantity).toBe(0); // Should be 0, not negative
    });
  });

  describe('Deleting Products', () => {
    it('should delete a product and update store count', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ storeId: 'store-123', productCount: 10 }),
      });
      mockDeleteDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await result.current.deleteProduct('product-1');
      });

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { unmount } = renderHook(() => useProducts());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
