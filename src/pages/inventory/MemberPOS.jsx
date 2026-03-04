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

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const displayedProducts = activeCategory === 'all'
    ? filteredProducts
    : filteredProducts.filter(p => p.category === activeCategory);

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
    if (cart.length === 0 || processing) return; // Guard against duplicate calls

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

  const lowStockCount = products.filter(p => p.quantity <= (p.lowStockThreshold || 10)).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

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
        {/* Store Header */}
        <div className="pos-store-header">
          <div className="pos-store-info">
            <div className="pos-store-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <h1 className="pos-store-name">{storeName || 'Point of Sale'}</h1>
              <span className="pos-store-subtitle">POS Terminal</span>
            </div>
          </div>
          <div className="pos-header-stats">
            <div className="pos-header-stat">
              <span className="pos-stat-number">{products.length}</span>
              <span className="pos-stat-text">Products</span>
            </div>
            <div className="pos-header-stat warning">
              <span className="pos-stat-number">{lowStockCount}</span>
              <span className="pos-stat-text">Low Stock</span>
            </div>
            {outOfStockCount > 0 && (
              <div className="pos-header-stat danger">
                <span className="pos-stat-number">{outOfStockCount}</span>
                <span className="pos-stat-text">Out</span>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="pos-search-bar">
          <div className="pos-search-input-wrap">
            <svg className="pos-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="pos-search-clear" onClick={() => setSearchTerm('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="pos-category-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`pos-category-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? 'All Items' : cat}
                {cat !== 'all' && (
                  <span className="pos-category-count">
                    {products.filter(p => p.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="pos-grid-container">
          {displayedProducts.length === 0 ? (
            <div className="pos-empty-state">
              <div className="pos-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="pos-products-grid">
              {displayedProducts.map((product) => {
                const inCart = cart.find(item => item.productId === product.id);
                const isOutOfStock = product.quantity === 0;
                const isLowStock = product.quantity <= (product.lowStockThreshold || 10);

                return (
                  <div
                    key={product.id}
                    className={`pos-card ${isOutOfStock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}`}
                    onClick={() => !isOutOfStock && addToCart(product, 1)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !isOutOfStock && addToCart(product, 1)}
                  >
                    {inCart && <div className="pos-card-cart-qty">{inCart.quantity}</div>}

                    <div className="pos-card-visual">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {isOutOfStock && <span className="pos-card-badge out">Out of stock</span>}
                      {!isOutOfStock && isLowStock && <span className="pos-card-badge low">Low stock</span>}
                    </div>

                    <div className="pos-card-body">
                      <h4 className="pos-card-name">{product.name}</h4>
                      <span className="pos-card-sku">{product.sku || product.barcode || ''}</span>
                    </div>

                    <div className="pos-card-footer">
                      <span className="pos-card-price">{formatCurrency(product.price)}</span>
                      <span className="pos-card-stock">
                        {isOutOfStock ? 'Unavailable' : `${product.quantity} in stock`}
                      </span>
                    </div>

                    {!isOutOfStock && (
                      <div className="pos-card-add">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <div className="pos-cart-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2>Current Sale</h2>
            {cart.length > 0 && <span className="pos-cart-badge">{totals.itemCount}</span>}
          </div>
          {cart.length > 0 && (
            <button className="pos-cart-clear" onClick={clearCart}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear all
            </button>
          )}
        </div>

        <div className="pos-cart-body">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <div className="pos-cart-empty-visual">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Click on a product or scan a barcode to get started</p>
            </div>
          ) : (
            <div className="pos-cart-items">
              {cart.map((item) => (
                <div key={item.productId} className="pos-cart-item">
                  <div className="pos-cart-item-info">
                    <h4>{item.productName}</h4>
                    <span>{formatCurrency(item.price)} each</span>
                  </div>
                  <div className="pos-cart-item-controls">
                    <button
                      className="pos-qty-btn minus"
                      onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="pos-qty-value">{item.quantity}</span>
                    <button
                      className="pos-qty-btn plus"
                      onClick={() => {
                        if (item.quantity < item.availableStock) {
                          updateCartItemQuantity(item.productId, item.quantity + 1);
                        }
                      }}
                      disabled={item.quantity >= item.availableStock}
                      aria-label="Increase quantity"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <span className="pos-cart-item-total">{formatCurrency(item.subtotal)}</span>
                  <button
                    className="pos-cart-item-remove"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label="Remove item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="pos-cart-footer">
          <div className="pos-cart-totals">
            <div className="pos-total-line">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="pos-total-line">
              <span>Tax (8%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="pos-total-line grand">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <button
            className="pos-checkout-btn"
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0 || processing}
          >
            {processing ? (
              <>
                <span className="pos-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Checkout {formatCurrency(totals.total)}
              </>
            )}
          </button>

          <div className="pos-quick-pay">
            <span className="pos-quick-pay-label">Quick Pay</span>
            <div className="pos-quick-pay-btns">
              <button onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'Cash' }); setShowCheckout(true); }} disabled={cart.length === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Cash
              </button>
              <button onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'Card' }); setShowCheckout(true); }} disabled={cart.length === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Card
              </button>
              <button onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'UPI' }); setShowCheckout(true); }} disabled={cart.length === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                UPI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="pos-modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="pos-checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div>
                <h2>Complete Sale</h2>
                <p>Review and finalize the transaction</p>
              </div>
              <button className="pos-modal-close" onClick={() => setShowCheckout(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pos-modal-content">
              {error && (
                <div className="pos-modal-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="pos-modal-total-banner">
                <span>Total Amount</span>
                <strong>{formatCurrency(totals.total)}</strong>
              </div>

              <div className="form-section">
                <label>Payment Method <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="payment-method-grid">
              <div className="pos-modal-section">
                <label>Payment Method</label>
                <div className="pos-payment-options">
                  {[
                    { id: 'Cash', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label: 'Cash' },
                    { id: 'Card', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label: 'Card' },
                    { id: 'UPI', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, label: 'UPI / Mobile' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      className={`pos-payment-option ${checkoutForm.paymentMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: method.id })}
                    >
                      {method.icon}
                      <span>{method.label}</span>
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
              <div className="pos-modal-section">
                <label>Customer Details <span className="optional-tag">Optional</span></label>
                <div className="pos-modal-row">
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    placeholder="Phone number"
                    value={checkoutForm.customerPhone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pos-modal-section">
                <label>Notes <span className="optional-tag">Optional</span></label>
                <textarea
                  placeholder="Add any notes for this sale..."
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="pos-modal-actions">
              <button className="pos-modal-cancel" onClick={() => setShowCheckout(false)}>
                Cancel
              </button>
              <button
                className="pos-modal-confirm"
                onClick={handleCheckout}
                disabled={processing || !checkoutForm.paymentMethod || !checkoutForm.customerName || !checkoutForm.customerPhone}
              >
                {processing ? (
                  <>
                    <span className="pos-spinner"></span>
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
