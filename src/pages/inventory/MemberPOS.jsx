import { useState, useRef, useEffect } from 'react';
import { usePOS } from '../../hooks/usePOS';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import DigitalReceipt from '../../components/inventory/DigitalReceipt';

export default function MemberPOS() {
  const { userProfile } = useInventoryAuth();
  const storeId = userProfile?.assignedStoreId;
  const storeName = userProfile?.assignedStoreName;

  const {
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
  } = usePOS(storeId);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [checkoutForm, setCheckoutForm] = useState({
    paymentMethod: 'Cash',
    customerName: '',
    customerPhone: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const searchInputRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);

  const totals = getCartTotals();
  const filteredProducts = searchProducts(searchTerm);

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter by category
  const displayedProducts = activeCategory === 'all'
    ? filteredProducts
    : filteredProducts.filter(p => p.category === activeCategory);

  // Handle barcode scanner input
  useEffect(() => {
    function handleKeyPress(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      clearTimeout(barcodeTimer.current);

      if (e.key === 'Enter' && barcodeBuffer.current) {
        const product = getProductByCode(barcodeBuffer.current);
        if (product) {
          addToCart(product, 1);
        }
        barcodeBuffer.current = '';
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    }

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [getProductByCode, addToCart]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  async function handleCheckout() {
    if (cart.length === 0) return;

    setError('');

    // Validate payment method is selected
    if (!checkoutForm.paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // Validate customer details are provided
    if (!checkoutForm.customerName || !checkoutForm.customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!checkoutForm.customerPhone || !checkoutForm.customerPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(checkoutForm.customerPhone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    try {
      await checkout(
        checkoutForm.paymentMethod,
        checkoutForm.customerName,
        checkoutForm.customerPhone,
        checkoutForm.notes
      );
      setShowCheckout(false);
      setShowReceipt(true);
      setCheckoutForm({
        paymentMethod: 'Cash',
        customerName: '',
        customerPhone: '',
        notes: '',
      });
    } catch (err) {
      setError(err.message || 'Checkout failed');
    }
  }

  function handleCloseReceipt() {
    setShowReceipt(false);
    setLastSale(null);
    searchInputRef.current?.focus();
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!storeId) {
    return (
      <main className="dashboard-content">
        <div className="error-state">
          <h2>No Store Assigned</h2>
          <p>Please contact your administrator to be assigned to a store.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pos-modern-layout">
      {/* Left Panel - Products */}
      <div className="pos-products-section">
        {/* Search Header */}
        <div className="pos-search-header">
          <div className="pos-search-box">
            <div className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <div className="pos-quick-stats">
            <div className="quick-stat">
              <span className="stat-value">{products.length}</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">{products.filter(p => p.quantity <= (p.lowStockThreshold || 10)).length}</span>
              <span className="stat-label">Low Stock</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="pos-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="pos-products-grid">
          {displayedProducts.length === 0 ? (
            <div className="pos-empty-products">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <h3>No products found</h3>
              <p>Try a different search term or category</p>
            </div>
          ) : (
            displayedProducts.map((product) => {
              const inCart = cart.find(item => item.productId === product.id);
              const isOutOfStock = product.quantity === 0;
              const isLowStock = product.quantity <= (product.lowStockThreshold || 10);

              return (
                <div
                  key={product.id}
                  className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}`}
                  onClick={() => !isOutOfStock && addToCart(product, 1)}
                >
                  <div className="product-image">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    {inCart && (
                      <div className="cart-badge">{inCart.quantity}</div>
                    )}
                    {isOutOfStock && (
                      <div className="stock-badge out">Out</div>
                    )}
                    {!isOutOfStock && isLowStock && (
                      <div className="stock-badge low">Low</div>
                    )}
                  </div>

                  <div className="product-details">
                    <h4 className="product-name">{product.name}</h4>
                    <span className="product-sku">{product.sku || product.barcode || 'No SKU'}</span>
                    <div className="product-footer">
                      <span className="product-price">{formatCurrency(product.price)}</span>
                      <span className="product-stock">
                        {isOutOfStock ? 'Out of stock' : `${product.quantity} left`}
                      </span>
                    </div>
                  </div>

                  <button className="add-to-cart-btn" disabled={isOutOfStock}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="pos-cart-section">
        <div className="cart-header">
          <div className="cart-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2>Current Sale</h2>
            {cart.length > 0 && <span className="cart-count">{totals.itemCount}</span>}
          </div>
          {cart.length > 0 && (
            <button className="clear-cart-btn" onClick={clearCart}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear
            </button>
          )}
        </div>

        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Add products by clicking on them or scanning a barcode</p>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.productId} className="cart-item-card">
                  <div className="item-image">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                  </div>
                  <div className="item-details">
                    <h4>{item.productName}</h4>
                    <span className="item-unit-price">{formatCurrency(item.price)} each</span>
                  </div>
                  <div className="item-quantity-control">
                    <button
                      className="qty-btn minus"
                      onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn plus"
                      onClick={() => {
                        if (item.quantity < item.availableStock) {
                          updateCartItemQuantity(item.productId, item.quantity + 1);
                        }
                      }}
                      disabled={item.quantity >= item.availableStock}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div className="item-subtotal">{formatCurrency(item.subtotal)}</div>
                  <button
                    className="item-remove-btn"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Checkout */}
        <div className="cart-checkout-section">
          <div className="cart-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="total-row">
              <span>Tax (8%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <button
            className="checkout-main-btn"
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0 || processing}
          >
            {processing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Checkout {formatCurrency(totals.total)}
              </>
            )}
          </button>

          <div className="payment-shortcuts">
            <span>Quick Pay:</span>
            <button onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'Cash' }); setShowCheckout(true); }}>
              💵 Cash
            </button>
            <button onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'Card' }); setShowCheckout(true); }}>
              💳 Card
            </button>
            <button onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'UPI' }); setShowCheckout(true); }}>
              📱 UPI
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="pos-modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="pos-checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Sale</h2>
              <button className="modal-close-btn" onClick={() => setShowCheckout(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="checkout-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="checkout-total-display">
                <span>Total Amount</span>
                <strong>{formatCurrency(totals.total)}</strong>
              </div>

              <div className="form-section">
                <label>Payment Method <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="payment-method-grid">
                  {[
                    { id: 'Cash', icon: '💵', label: 'Cash' },
                    { id: 'Card', icon: '💳', label: 'Card' },
                    { id: 'UPI', icon: '📱', label: 'UPI/Mobile' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      className={`payment-method-btn ${checkoutForm.paymentMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: method.id })}
                    >
                      <span className="method-icon">{method.icon}</span>
                      <span className="method-label">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label>Customer Details <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={checkoutForm.customerPhone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <label>Notes</label>
                <textarea
                  placeholder="Add any notes for this sale..."
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCheckout(false)}>
                Cancel
              </button>
              <button
                className="btn-complete-sale"
                onClick={handleCheckout}
                disabled={processing || !checkoutForm.paymentMethod || !checkoutForm.customerName || !checkoutForm.customerPhone}
              >
                {processing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastSale && (
        <DigitalReceipt
          sale={lastSale}
          storeName={storeName}
          onClose={handleCloseReceipt}
        />
      )}
    </main>
  );
}
