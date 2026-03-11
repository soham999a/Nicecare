import { useState, useRef, useEffect, useMemo } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  getAuth,
  inMemoryPersistence,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { usePOS } from '../../hooks/usePOS';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useEmployees } from '../../hooks/useEmployees';
import { auth } from '../../config/firebase';
import DigitalReceipt from '../../components/inventory/DigitalReceipt';

export default function MemberPOS() {
  const { userProfile, currentUser } = useInventoryAuth();
  const { employees } = useEmployees();
  const isManager = userProfile?.role === 'manager';
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
    selectedEmployeeId: '',
    discountType: 'amount',
    discountValue: '',
    discountReason: '',
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    managerPassword: '',
    employeePassword: '',
  });
  const [approvalError, setApprovalError] = useState('');
  const [approvalProcessing, setApprovalProcessing] = useState(false);
  const [error, setError] = useState('');

  const searchInputRef = useRef(null);
  const skuBuffer = useRef('');
  const skuTimer = useRef(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === checkoutForm.selectedEmployeeId) || null,
    [employees, checkoutForm.selectedEmployeeId]
  );
  const eligibleMembers = useMemo(
    () => employees.filter((employee) => employee.role === 'member' && employee.assignedStoreId === storeId),
    [employees, storeId]
  );
  const discountInputValue = Number.parseFloat(checkoutForm.discountValue);
  const discountValue = Number.isFinite(discountInputValue) ? discountInputValue : 0;
  const discountConfig = isManager
    ? {
      type: checkoutForm.discountType,
      value: discountValue,
      reason: checkoutForm.discountReason,
    }
    : null;
  const totals = getCartTotals(discountConfig);
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

      clearTimeout(skuTimer.current);

      if (e.key === 'Enter' && skuBuffer.current) {
        const product = getProductByCode(skuBuffer.current);
        if (product) {
          addToCart(product, 1);
        }
        skuBuffer.current = '';
      } else if (e.key.length === 1) {
        skuBuffer.current += e.key;
        skuTimer.current = setTimeout(() => {
          skuBuffer.current = '';
        }, 100);
      }
    }

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [getProductByCode, addToCart]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  function resetApprovalState() {
    setShowApprovalModal(false);
    setApprovalError('');
    setApprovalForm({
      managerPassword: '',
      employeePassword: '',
    });
  }

  async function verifyManagerPassword(managerPassword) {
    if (!auth.currentUser?.email) {
      throw new Error('Manager email is missing. Please sign in again.');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, managerPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
  }

  async function verifyEmployeePassword(employeeEmail, employeePassword) {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const verificationAppName = 'employee-password-verification';
    const verificationApp = getApps().some((app) => app.name === verificationAppName)
      ? getApp(verificationAppName)
      : initializeApp(firebaseConfig, verificationAppName);
    const verificationAuth = getAuth(verificationApp);
    await setPersistence(verificationAuth, inMemoryPersistence);
    await signInWithEmailAndPassword(verificationAuth, employeeEmail, employeePassword);
    await signOut(verificationAuth);
  }

  async function performCheckout(approvalPayload = null) {
    await checkout(
      checkoutForm.paymentMethod,
      checkoutForm.customerName,
      checkoutForm.customerPhone,
      checkoutForm.notes,
      {
        selectedEmployee,
        discountConfig,
        approvalPayload,
        actorRole: userProfile?.role || 'member',
      }
    );
    setShowCheckout(false);
    resetApprovalState();
    setShowReceipt(true);
    setCheckoutForm({
      paymentMethod: 'Cash',
      customerName: '',
      customerPhone: '',
      notes: '',
      selectedEmployeeId: '',
      discountType: 'amount',
      discountValue: '',
      discountReason: '',
    });
  }

  async function handleCheckout() {
    if (cart.length === 0 || processing) return;

    setError('');

    if (!checkoutForm.paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!checkoutForm.customerName || !checkoutForm.customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!checkoutForm.customerPhone || !checkoutForm.customerPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(checkoutForm.customerPhone.replace(/[-\s()]/g, ''))) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    if (isManager) {
      if (!checkoutForm.selectedEmployeeId) {
        setError('Please select an employee to credit this sale');
        return;
      }
      if (!selectedEmployee || selectedEmployee.role !== 'member' || selectedEmployee.assignedStoreId !== storeId) {
        setError('Selected employee must be a member from this store');
        return;
      }
      if (!selectedEmployee.email) {
        setError('Selected employee does not have an email for password verification');
        return;
      }
      if (discountValue > 0 && !checkoutForm.discountReason.trim()) {
        setError('Discount reason is required when applying a discount override');
        return;
      }
      if (discountValue < 0) {
        setError('Discount value cannot be negative');
        return;
      }
      if (checkoutForm.discountType === 'percentage' && discountValue > 100) {
        setError('Discount percentage cannot exceed 100');
        return;
      }
      if (totals.discountAmount > totals.baseSubtotal) {
        setError('Discount cannot exceed subtotal');
        return;
      }
      setShowApprovalModal(true);
      return;
    }

    try {
      await performCheckout();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    }
  }

  async function handleApprovalAndCheckout() {
    if (approvalProcessing || !currentUser?.uid || !currentUser?.email || !selectedEmployee?.email) return;
    setApprovalError('');

    if (!approvalForm.managerPassword || !approvalForm.employeePassword) {
      setApprovalError('Both manager and employee passwords are required');
      return;
    }

    try {
      setApprovalProcessing(true);
      await verifyManagerPassword(approvalForm.managerPassword);
      await verifyEmployeePassword(selectedEmployee.email, approvalForm.employeePassword);
      await performCheckout({
        managerUid: currentUser.uid,
        managerEmail: currentUser.email,
        employeeUid: selectedEmployee.id,
        employeeEmail: selectedEmployee.email,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'dual-password',
      });
    } catch (err) {
      setApprovalError(err.message || 'Password verification failed');
    } finally {
      setApprovalProcessing(false);
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
      <main className="flex flex-col gap-5 flex-1 min-h-0">
        <div className="min-h-[170px] flex flex-col items-center justify-center border border-dashed border-red-600/35 dark:border-red-400/35 rounded-xl mt-2 text-red-600 dark:text-red-400 bg-red-600/5 dark:bg-red-400/5 px-4">
          <h2 className="text-base font-semibold mb-1">No Store Assigned</h2>
          <p className="text-sm">Please contact your administrator to be assigned to a store.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px] h-[calc(100vh-70px)] bg-slate-50 dark:bg-[#0a0f1a]">
      <div className="flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0a0f1a]">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg text-white shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-gray-50 tracking-tight leading-tight">{storeName || 'Point of Sale'}</h1>
              <span className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">POS Terminal</span>
            </div>
          </div>
          <div className="hidden lg:flex gap-2">
            <div className="flex flex-col items-center px-3.5 py-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-400/10">
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 leading-tight">{products.length}</span>
              <span className="text-[0.625rem] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Products</span>
            </div>
            <div className="flex flex-col items-center px-3.5 py-1.5 rounded-lg bg-amber-600/10 dark:bg-amber-400/10">
              <span className="text-base font-bold text-amber-600 dark:text-amber-400 leading-tight">{lowStockCount}</span>
              <span className="text-[0.625rem] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Low Stock</span>
            </div>
            {outOfStockCount > 0 && (
              <div className="flex flex-col items-center px-3.5 py-1.5 rounded-lg bg-red-600/10 dark:bg-red-400/10">
                <span className="text-base font-bold text-red-600 dark:text-red-400 leading-tight">{outOfStockCount}</span>
                <span className="text-[0.625rem] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">Out</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2 sm:px-6 sm:py-3 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded-lg transition-all focus-within:border-blue-600 dark:focus-within:border-blue-400 focus-within:ring-[3px] focus-within:ring-blue-600/20 dark:focus-within:ring-blue-400/20">
            <svg className="text-slate-400 dark:text-gray-500 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products or scan SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none bg-transparent text-[0.9375rem] text-slate-900 dark:text-gray-50 outline-none font-[inherit] placeholder:text-slate-400 dark:placeholder:text-gray-500"
            />
            {searchTerm && (
              <button
                className="w-[26px] h-[26px] flex items-center justify-center border-none bg-white dark:bg-gray-900 rounded text-slate-400 dark:text-gray-500 cursor-pointer transition-colors hover:bg-red-600/10 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
                onClick={() => setSearchTerm('')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-transparent text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                    : 'bg-slate-50 dark:bg-[#0a0f1a] border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-600/10 dark:hover:bg-blue-400/10'
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? 'All Items' : cat}
                {cat !== 'all' && (
                  <span className={`text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat
                      ? 'bg-white/25 text-white'
                      : 'bg-white dark:bg-gray-900 text-slate-400 dark:text-gray-500'
                  }`}>
                    {products.filter(p => p.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 sm:px-6 sm:py-5">
          {displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-[88px] h-[88px] flex items-center justify-center bg-white dark:bg-gray-900 rounded-full text-slate-400 dark:text-gray-500 mb-5">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-600 dark:text-gray-400 mb-1.5">No products found</h3>
              <p className="text-[0.8125rem] text-slate-400 dark:text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(185px,1fr))] sm:gap-3.5 content-start">
              {displayedProducts.map((product) => {
                const inCart = cart.find(item => item.productId === product.id);
                const isOutOfStock = product.quantity === 0;
                const isLowStock = product.quantity <= (product.lowStockThreshold || 10);

                return (
                  <div
                    key={product.id}
                    className={`group relative flex flex-col bg-white dark:bg-gray-800 border-[1.5px] rounded-xl p-2.5 sm:p-3.5 cursor-pointer transition-all duration-200 overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400 focus-visible:outline-offset-2 ${
                      isOutOfStock
                        ? 'opacity-45 cursor-not-allowed grayscale-[0.3] border-slate-200 dark:border-gray-700'
                        : inCart
                          ? 'border-emerald-600 dark:border-emerald-500 bg-gradient-to-b from-emerald-600/[0.04] to-white dark:from-emerald-400/[0.06] dark:to-gray-800 hover:-translate-y-[3px] hover:shadow-lg'
                          : 'border-slate-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-400 hover:-translate-y-[3px] hover:shadow-lg'
                    }`}
                    onClick={() => !isOutOfStock && addToCart(product, 1)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !isOutOfStock && addToCart(product, 1)}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-200 ${
                      inCart
                        ? 'bg-emerald-600 dark:bg-emerald-400 opacity-100'
                        : isOutOfStock
                          ? 'opacity-0'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100'
                    }`} />

                    {inCart && (
                      <div className="absolute top-2 right-2 min-w-[22px] h-[22px] flex items-center justify-center bg-emerald-600 dark:bg-emerald-500 text-white text-[0.6875rem] font-bold rounded-full px-1.5 z-[2] shadow-[0_2px_6px_rgba(5,150,105,0.3)]">
                        {inCart.quantity}
                      </div>
                    )}

                    <div className="relative w-full h-[52px] sm:h-[68px] flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] rounded-md mb-2 sm:mb-3 text-slate-400 dark:text-gray-500">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {isOutOfStock && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide rounded bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400">
                          Out of stock
                        </span>
                      )}
                      {!isOutOfStock && isLowStock && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide rounded bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                          Low stock
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <h4 className="text-[0.8125rem] sm:text-sm font-semibold text-slate-900 dark:text-gray-50 leading-tight line-clamp-2">{product.name}</h4>
                      <span className="text-[0.6875rem] text-slate-400 dark:text-gray-500 mb-auto font-mono">{product.sku || ''}</span>
                    </div>

                    <div className="flex justify-between items-end mt-2.5 pt-2 border-t border-slate-200 dark:border-gray-700">
                      <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 tracking-tight">{formatCurrency(product.price)}</span>
                      <span className="text-[0.6875rem] text-slate-400 dark:text-gray-500">
                        {isOutOfStock ? 'Unavailable' : `${product.quantity} in stock`}
                      </span>
                    </div>

                    {!isOutOfStock && (
                      <div className="absolute bottom-3 right-3 w-8 h-8 hidden sm:flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-500 rounded-md text-white opacity-0 scale-[0.8] translate-y-1 transition-all duration-200 pointer-events-none shadow-[0_2px_8px_rgba(37,99,235,0.25)] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0">
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

      <div className="flex flex-col bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-gray-700 max-h-[50vh] lg:max-h-none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-gray-50">
            <svg className="text-blue-600 dark:text-blue-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2 className="text-base font-bold tracking-tight">Current Sale</h2>
            {cart.length > 0 && (
              <span className="min-w-[22px] h-[22px] flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[0.6875rem] font-bold rounded-full px-1.5">
                {totals.itemCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/10 dark:bg-red-400/10 border-none rounded text-red-600 dark:text-red-400 text-xs font-semibold cursor-pointer transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white"
              onClick={clearCart}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] rounded-full mb-5 text-slate-400 dark:text-gray-500">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-slate-600 dark:text-gray-400 mb-1.5">Your cart is empty</h3>
              <p className="text-[0.8125rem] text-slate-400 dark:text-gray-500 max-w-[220px] leading-relaxed">Click on a product or scan a SKU to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-[#0a0f1a] border border-slate-200 dark:border-gray-700 rounded-lg transition-all hover:border-slate-300 dark:hover:border-gray-600 hover:shadow-sm">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[0.8125rem] font-semibold text-slate-900 dark:text-gray-50 truncate leading-tight">{item.productName}</h4>
                    <span className="text-[0.6875rem] text-slate-400 dark:text-gray-500">{formatCurrency(item.price)} each</span>
                  </div>
                  <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 rounded p-0.5">
                    <button
                      className="w-[26px] h-[26px] flex items-center justify-center border-none rounded cursor-pointer transition-colors bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400 hover:bg-red-600/20 dark:hover:bg-red-400/20"
                      onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="min-w-7 text-center font-bold text-sm text-slate-900 dark:text-gray-50">{item.quantity}</span>
                    <button
                      className="w-[26px] h-[26px] flex items-center justify-center border-none rounded cursor-pointer transition-colors bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 hover:bg-emerald-600/20 dark:hover:bg-emerald-400/20 disabled:opacity-35 disabled:cursor-not-allowed"
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
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400 min-w-[60px] text-right">{formatCurrency(item.subtotal)}</span>
                  <button
                    className="w-[26px] h-[26px] flex items-center justify-center bg-transparent border-none rounded text-slate-400 dark:text-gray-500 cursor-pointer transition-colors hover:bg-red-600/10 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
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

        <div className="px-5 pt-4 pb-5 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700">
          <div className="mb-4">
            <div className="flex justify-between items-center py-1.5 text-sm text-slate-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.baseSubtotal)}</span>
            </div>
            {isManager && totals.discountAmount > 0 && (
              <div className="flex justify-between items-center py-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <span>Discount Override</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1.5 text-sm text-slate-600 dark:text-gray-400">
              <span>Tax (8%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t-2 border-slate-200 dark:border-gray-700 text-lg font-bold text-slate-900 dark:text-gray-50">
              <span>Total</span>
              <span className="text-xl text-blue-600 dark:text-blue-400">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-500 border-none rounded-lg text-white text-base font-semibold relative overflow-hidden cursor-pointer transition-all duration-250 shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_8px_24px_rgba(37,99,235,0.35)] active:not-disabled:translate-y-0 active:not-disabled:scale-[0.98] disabled:bg-slate-400 dark:disabled:bg-gray-500 disabled:shadow-none disabled:cursor-not-allowed before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent before:pointer-events-none"
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0 || processing}
          >
            {processing ? (
              <>
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

          <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 dark:border-gray-700">
            <span className="block text-[0.6875rem] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2 text-center">Quick Pay</span>
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded text-xs font-medium text-slate-600 dark:text-gray-400 cursor-pointer transition-all hover:not-disabled:border-blue-600 dark:hover:not-disabled:border-blue-400 hover:not-disabled:text-blue-600 dark:hover:not-disabled:text-blue-400 hover:not-disabled:bg-blue-600/10 dark:hover:not-disabled:bg-blue-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'Cash' }); setShowCheckout(true); }}
                disabled={cart.length === 0}
              >
                <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Cash
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded text-xs font-medium text-slate-600 dark:text-gray-400 cursor-pointer transition-all hover:not-disabled:border-blue-600 dark:hover:not-disabled:border-blue-400 hover:not-disabled:text-blue-600 dark:hover:not-disabled:text-blue-400 hover:not-disabled:bg-blue-600/10 dark:hover:not-disabled:bg-blue-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'Card' }); setShowCheckout(true); }}
                disabled={cart.length === 0}
              >
                <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Card
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded text-xs font-medium text-slate-600 dark:text-gray-400 cursor-pointer transition-all hover:not-disabled:border-blue-600 dark:hover:not-disabled:border-blue-400 hover:not-disabled:text-blue-600 dark:hover:not-disabled:text-blue-400 hover:not-disabled:bg-blue-600/10 dark:hover:not-disabled:bg-blue-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => { setCheckoutForm({ ...checkoutForm, paymentMethod: 'UPI' }); setShowCheckout(true); }}
                disabled={cart.length === 0}
              >
                <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                UPI
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[8px] flex items-center justify-center z-[1000] p-6 animate-fade-in" onClick={() => { setShowCheckout(false); resetApprovalState(); }}>
          <div className="w-full max-w-[480px] bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden animate-modal-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-slate-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-gray-50 tracking-tight mb-0.5">Complete Sale</h2>
                <p className="text-[0.8125rem] text-slate-400 dark:text-gray-500">Review and finalize the transaction</p>
              </div>
              <button
                className="w-[34px] h-[34px] flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] border border-slate-200 dark:border-gray-700 rounded cursor-pointer transition-all shrink-0 text-slate-400 dark:text-gray-500 hover:bg-red-600/10 hover:border-red-600 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:border-red-400 dark:hover:text-red-400"
                onClick={() => { setShowCheckout(false); resetApprovalState(); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-600/10 dark:bg-red-400/10 border border-red-600 dark:border-red-400 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium mb-5">
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between items-center px-5 py-[1.125rem] bg-blue-600/10 dark:bg-blue-400/10 border border-blue-600/50 dark:border-blue-400/30 rounded-lg mb-6">
                <span className="text-slate-600 dark:text-gray-400 text-[0.9375rem] font-medium">Total Amount</span>
                <strong className="text-[1.625rem] font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">{formatCurrency(totals.total)}</strong>
              </div>

              {isManager && (
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-[0.8125rem] font-semibold text-slate-600 dark:text-gray-400 mb-2.5 uppercase tracking-wide">Employee Credit *</label>
                  <select
                    value={checkoutForm.selectedEmployeeId}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, selectedEmployeeId: e.target.value })}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20"
                  >
                    <option value="">Select employee</option>
                    {eligibleMembers.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.displayName || employee.name || employee.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isManager && (
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-[0.8125rem] font-semibold text-slate-600 dark:text-gray-400 mb-2.5 uppercase tracking-wide">Discount Override</label>
                  <div className="grid grid-cols-[130px_1fr] gap-2.5 mb-2.5">
                    <select
                      value={checkoutForm.discountType}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, discountType: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20"
                    >
                      <option value="amount">Amount</option>
                      <option value="percentage">Percent</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={checkoutForm.discountType === 'percentage' ? '0-100' : '0.00'}
                      value={checkoutForm.discountValue}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, discountValue: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <textarea
                    placeholder="Reason for discount override (required if discount applied)"
                    value={checkoutForm.discountReason}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, discountReason: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all resize-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                  />
                  {totals.discountAmount > 0 && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                      Discount applied: -{formatCurrency(totals.discountAmount)}
                    </p>
                  )}
                </div>
              )}

              <div className="mb-5">
                <label className="flex items-center gap-2 text-[0.8125rem] font-semibold text-slate-600 dark:text-gray-400 mb-2.5 uppercase tracking-wide">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['Cash', 'Card', 'UPI'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`flex flex-col items-center gap-2 py-3.5 px-2 border-[1.5px] rounded-lg cursor-pointer transition-all text-[0.8125rem] font-semibold ${
                        checkoutForm.paymentMethod === method
                          ? 'border-blue-600 dark:border-blue-400 bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 ring-[3px] ring-blue-600/20 dark:ring-blue-400/20'
                          : 'bg-slate-50 dark:bg-[#0a0f1a] border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      onClick={() =>
                        setCheckoutForm({ ...checkoutForm, paymentMethod: method })
                      }
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="flex items-center gap-2 text-[0.8125rem] font-semibold text-slate-600 dark:text-gray-400 mb-2.5 uppercase tracking-wide">Customer Details *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={checkoutForm.customerName}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, customerName: e.target.value })
                    }
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={checkoutForm.customerPhone}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })
                    }
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="flex items-center gap-2 text-[0.8125rem] font-semibold text-slate-600 dark:text-gray-400 mb-2.5 uppercase tracking-wide">Notes (Optional)</label>
                <textarea
                  placeholder="Add any notes for this sale..."
                  value={checkoutForm.notes}
                  onChange={(e) =>
                    setCheckoutForm({ ...checkoutForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all resize-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700">
              <button
                className="flex-1 py-3 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-gray-400 text-sm font-semibold cursor-pointer transition-all hover:border-slate-300 dark:hover:border-gray-600 hover:text-slate-900 dark:hover:text-gray-50"
                onClick={() => { setShowCheckout(false); resetApprovalState(); }}
              >
                Cancel
              </button>
              <button
                className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-emerald-600 to-emerald-700 border-none rounded-lg text-white text-sm font-semibold relative overflow-hidden cursor-pointer transition-all hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_6px_20px_rgba(5,150,105,0.4)] disabled:bg-slate-400 dark:disabled:bg-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:bg-none"
                onClick={handleCheckout}
                disabled={processing || !checkoutForm.paymentMethod || !checkoutForm.customerName || !checkoutForm.customerPhone || (isManager && !checkoutForm.selectedEmployeeId)}
              >
                {processing ? (
                  <>
                    <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

      {showApprovalModal && isManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[6px] flex items-center justify-center z-[1100] p-6" onClick={resetApprovalState}>
          <div className="w-full max-w-[460px] bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-gray-50">Dual Approval Required</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Confirm manager and employee passwords before checkout.
              </p>
            </div>
            <div className="px-6 py-5">
              {approvalError && (
                <div className="mb-4 px-3.5 py-2.5 bg-red-600/10 dark:bg-red-400/10 border border-red-600/50 dark:border-red-400/40 rounded text-sm text-red-600 dark:text-red-400">
                  {approvalError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-2">Manager Password *</label>
                  <input
                    type="password"
                    value={approvalForm.managerPassword}
                    onChange={(e) => setApprovalForm({ ...approvalForm, managerPassword: e.target.value })}
                    placeholder="Enter manager password"
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-2">Employee Password *</label>
                  <input
                    type="password"
                    value={approvalForm.employeePassword}
                    onChange={(e) => setApprovalForm({ ...approvalForm, employeePassword: e.target.value })}
                    placeholder={`Enter password for ${selectedEmployee?.displayName || selectedEmployee?.name || selectedEmployee?.email || 'employee'}`}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0a0f1a] border-[1.5px] border-slate-200 dark:border-gray-700 rounded text-sm text-slate-900 dark:text-gray-50 outline-none font-[inherit] transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-600/20 dark:focus:ring-blue-400/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700">
              <button
                className="flex-1 py-2.5 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-gray-400 transition-all hover:border-slate-300 dark:hover:border-gray-600"
                onClick={resetApprovalState}
                disabled={approvalProcessing}
              >
                Back
              </button>
              <button
                className="flex-[1.8] py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 border-none rounded-lg text-sm font-semibold text-white transition-all hover:not-disabled:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleApprovalAndCheckout}
                disabled={approvalProcessing || !approvalForm.managerPassword || !approvalForm.employeePassword}
              >
                {approvalProcessing ? 'Verifying...' : 'Verify & Complete Sale'}
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
