import { useState, useCallback } from 'react';
import { useProducts } from './useProducts';
import { useSales } from './useSales';

export function usePOS(storeId) {
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const { products, bulkUpdateStock } = useProducts(storeId);
  const { createSale } = useSales(storeId);

  // Add product to cart
  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      
      if (existingItem) {
        // Check if we have enough stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.quantity) {
          return prevCart; // Don't add if not enough stock
        }
        
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
            : item
        );
      } else {
        // Check if we have stock
        if (quantity > product.quantity) {
          return prevCart;
        }
        
        return [
          ...prevCart,
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku || '',
            price: product.price,
            quantity,
            subtotal: product.price * quantity,
            availableStock: product.quantity,
          },
        ];
      }
    });
  }, []);

  // Update item quantity in cart
  const updateCartItemQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate cart totals
  const getCartTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const tax = 0; // Can be configured based on business needs
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      itemCount,
    };
  }, [cart]);

  // Process checkout
  const checkout = useCallback(async (paymentMethod, customerName = '', customerPhone = '', notes = '') => {
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    setProcessing(true);

    try {
      const totals = getCartTotals();
      
      // Create sale record
      const saleData = {
        storeId,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        itemCount: totals.itemCount,
        paymentMethod,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        notes: notes || '',
      };

      const saleId = await createSale(saleData);

      // Update stock for all items
      const stockUpdates = cart.map((item) => ({
        productId: item.productId,
        quantityChange: -item.quantity,
      }));
      
      await bulkUpdateStock(stockUpdates);

      // Store last sale for receipt
      const completedSale = {
        id: saleId,
        ...saleData,
        createdAt: new Date(),
      };
      
      setLastSale(completedSale);
      
      // Clear cart after successful checkout
      clearCart();

      return completedSale;
    } finally {
      setProcessing(false);
    }
  }, [cart, storeId, createSale, bulkUpdateStock, getCartTotals, clearCart]);

  // Search products
  const searchProducts = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      return products;
    }

    const term = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.barcode?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
    );
  }, [products]);

  // Get product by barcode/SKU
  const getProductByCode = useCallback((code) => {
    return products.find(
      (product) =>
        product.barcode === code ||
        product.sku === code
    );
  }, [products]);

  return {
    cart,
    products,
    processing,
    lastSale,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
    checkout,
    searchProducts,
    getProductByCode,
    setLastSale,
  };
}
