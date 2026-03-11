import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the dependent hooks
const mockProducts = [
  {
    id: 'product-1',
    name: 'iPhone 16 Pro Max',
    sku: 'IPH-16-PRO-MAX',
    price: 1199.99,
    quantity: 25,
  },
  {
    id: 'product-2',
    name: 'Samsung Galaxy S25',
    sku: 'SAM-S25',
    price: 999.99,
    quantity: 15,
  },
];

const mockBulkUpdateStock = vi.fn();
const mockCreateSale = vi.fn();

vi.mock('../useProducts', () => ({
  useProducts: () => ({
    products: mockProducts,
    bulkUpdateStock: mockBulkUpdateStock,
  }),
}));

vi.mock('../useSales', () => ({
  useSales: () => ({
    createSale: mockCreateSale,
  }),
}));

import { usePOS } from '../usePOS';

describe('usePOS Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSale.mockResolvedValue('sale-123');
    mockBulkUpdateStock.mockResolvedValue(undefined);
  });

  describe('Cart Management', () => {
    it('should start with empty cart', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      expect(result.current.cart).toEqual([]);
      expect(result.current.processing).toBe(false);
      expect(result.current.lastSale).toBeNull();
    });

    it('should add product to cart', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].productId).toBe('product-1');
      expect(result.current.cart[0].quantity).toBe(1);
      expect(result.current.cart[0].subtotal).toBe(1199.99);
    });

    it('should increase quantity when adding same product', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      act(() => {
        result.current.addToCart(mockProducts[0], 2);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(3);
      // Use toBeCloseTo for floating point comparison
      expect(result.current.cart[0].subtotal).toBeCloseTo(3599.97, 2);
    });

    it('should not add more than available stock', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 30); // Only 25 in stock
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should update cart item quantity', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      act(() => {
        result.current.updateCartItemQuantity('product-1', 5);
      });

      expect(result.current.cart[0].quantity).toBe(5);
      expect(result.current.cart[0].subtotal).toBe(5999.95);
    });

    it('should remove item when quantity is set to 0', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      act(() => {
        result.current.updateCartItemQuantity('product-1', 0);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should remove product from cart', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
        result.current.addToCart(mockProducts[1], 1);
      });

      expect(result.current.cart).toHaveLength(2);

      act(() => {
        result.current.removeFromCart('product-1');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].productId).toBe('product-2');
    });

    it('should clear entire cart', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
        result.current.addToCart(mockProducts[1], 2);
      });

      expect(result.current.cart).toHaveLength(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
    });
  });

  describe('Cart Totals', () => {
    it('should calculate cart totals correctly', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1); // 1199.99
        result.current.addToCart(mockProducts[1], 2); // 1999.98
      });

      const totals = result.current.getCartTotals();

      // Use toBeCloseTo for floating point comparison
      expect(totals.subtotal).toBeCloseTo(3199.97, 2);
      expect(totals.baseSubtotal).toBeCloseTo(3199.97, 2);
      expect(totals.discountAmount).toBe(0);
      expect(totals.itemCount).toBe(3);
      expect(totals.tax).toBe(0);
      expect(totals.total).toBeCloseTo(3199.97, 2);
    });

    it('should return zero totals for empty cart', () => {
      const { result } = renderHook(() => usePOS('store-123'));

      const totals = result.current.getCartTotals();

      expect(totals.subtotal).toBe(0);
      expect(totals.baseSubtotal).toBe(0);
      expect(totals.discountAmount).toBe(0);
      expect(totals.itemCount).toBe(0);
      expect(totals.total).toBe(0);
    });
  });

  describe('Checkout Process', () => {
    it('should complete checkout successfully', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      let completedSale;
      await act(async () => {
        completedSale = await result.current.checkout('Cash', 'John Doe', '555-1234', 'Test sale');
      });

      expect(completedSale).toBeDefined();
      expect(completedSale.id).toBe('sale-123');
      expect(completedSale.paymentMethod).toBe('Cash');
      expect(completedSale.customerName).toBe('John Doe');
      expect(result.current.cart).toHaveLength(0);
      expect(result.current.lastSale).toBeDefined();
    });

    it('should call createSale with correct data', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 2);
      });

      await act(async () => {
        await result.current.checkout('Card', 'Jane Doe');
      });

      expect(mockCreateSale).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store-123',
          paymentMethod: 'Card',
          customerName: 'Jane Doe',
          total: 2399.98,
          itemCount: 2,
        }),
        expect.objectContaining({ selectedEmployee: null })
      );
    });

    it('should update stock after successful checkout', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 3);
        result.current.addToCart(mockProducts[1], 1);
      });

      await act(async () => {
        await result.current.checkout('Cash');
      });

      expect(mockBulkUpdateStock).toHaveBeenCalledWith([
        { productId: 'product-1', quantityChange: -3 },
        { productId: 'product-2', quantityChange: -1 },
      ]);
    });

    it('should throw error for empty cart checkout', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      await expect(
        result.current.checkout('Cash')
      ).rejects.toThrow('Cart is empty');
    });

    it('should set default customer name for walk-in', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      await act(async () => {
        await result.current.checkout('Cash');
      });

      expect(mockCreateSale).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Walk-in Customer',
        }),
        expect.objectContaining({ selectedEmployee: null })
      );
    });

    it('should handle processing state during checkout', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      let checkoutPromise;
      act(() => {
        checkoutPromise = result.current.checkout('Cash');
      });

      expect(result.current.processing).toBe(true);

      await act(async () => {
        await checkoutPromise;
      });

      expect(result.current.processing).toBe(false);
    });

    it('should reset processing state on checkout error', async () => {
      mockCreateSale.mockRejectedValue(new Error('Sale failed'));
      
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      await expect(
        act(async () => {
          await result.current.checkout('Cash');
        })
      ).rejects.toThrow('Sale failed');

      expect(result.current.processing).toBe(false);
    });
  });

  describe('Last Sale Tracking', () => {
    it('should store last completed sale', async () => {
      const { result } = renderHook(() => usePOS('store-123'));

      act(() => {
        result.current.addToCart(mockProducts[0], 1);
      });

      await act(async () => {
        await result.current.checkout('Cash', 'Test Customer');
      });

      expect(result.current.lastSale).toBeDefined();
      expect(result.current.lastSale.id).toBe('sale-123');
      expect(result.current.lastSale.customerName).toBe('Test Customer');
    });
  });
});
