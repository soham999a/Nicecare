import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useProducts } from '../../hooks/useProducts';
import { useStores } from '../../hooks/useStores';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ProductManagement() {
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => {
      document.body.classList.remove('edge-to-edge-page');
    };
  }, []);

  const { userProfile } = useInventoryAuth();
  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';

  if (!isMaster && !isManager) {
    return <Navigate to="/inventory/pos" replace />;
  }

  return (
    <ProductManagementContent
      userProfile={userProfile}
      isManager={isManager}
    />
  );
}

function ProductManagementContent({ userProfile, isManager }) {
  const formCardRef = useRef(null);

  const [filterStore, setFilterStore] = useState('');
  const managerStoreId = isManager ? userProfile?.assignedStoreId || null : null;
  const managerStoreName = isManager ? (userProfile?.assignedStoreName || 'My Store') : '';
  const { stores } = useStores();
  const availableStores = isManager && managerStoreId
    ? [{ id: managerStoreId, name: managerStoreName }]
    : stores;
  const effectiveStoreFilter = isManager ? managerStoreId : (filterStore || null);
  const { products, loading, error, lowStockProducts, addProduct, updateProduct, updateStock, deleteProduct } = useProducts(effectiveStoreFilter);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(null);
  const [stockChange, setStockChange] = useState({ quantity: 0, reason: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const getDefaultFormData = () => ({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    lowStockThreshold: '10',
    storeId: isManager ? managerStoreId || '' : '',
    storeName: isManager ? managerStoreName : '',
  });
  const [formData, setFormData] = useState(() => getDefaultFormData());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (showStockModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showStockModal]);

  const categories = [
    'Electronics',
    'Accessories',
    'Parts',
    'Tools',
    'Software',
    'Services',
    'Other',
  ];

  function resetForm() {
    setFormData(getDefaultFormData());
    setEditingProduct(null);
    setShowForm(false);
    setFormError('');
  }

  function openCreateForm() {
    setFormData(getDefaultFormData());
    setEditingProduct(null);
    setFormError('');
    setShowForm(true);
  }

  function handleStoreChange(storeId) {
    const store = availableStores.find(s => s.id === storeId);
    setFormData({
      ...formData,
      storeId,
      storeName: store?.name || '',
    });
  }

  function handleEdit(product) {
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
      quantity: product.quantity?.toString() || '',
      lowStockThreshold: product.lowStockThreshold?.toString() || '10',
      storeId: product.storeId || '',
      storeName: product.storeName || '',
    });
    setEditingProduct(product);
    setShowForm(true);
  }

  useLayoutEffect(() => {
    if (showForm && formCardRef.current) {
      formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      setFormError('Please enter a valid price');
      return;
    }

    if (!formData.storeId) {
      setFormError('Please assign the product to a store');
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        quantity: parseInt(formData.quantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        storeId: formData.storeId,
        storeName: formData.storeName,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockUpdate() {
    if (!showStockModal || stockChange.quantity === 0) return;

    try {
      await updateStock(showStockModal.id, stockChange.quantity, stockChange.reason);
      setShowStockModal(null);
      setStockChange({ quantity: 0, reason: '' });
    } catch (err) {
      alert('Failed to update stock: ' + err.message);
    }
  }

  async function handleDelete(productId, productName) {
    setDeleteConfirm({ id: productId, name: productName });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    try {
      await deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
      setDeleteConfirm(null);
    }
  }

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-50">Product Management</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage your product catalog and inventory</p>
        </div>

        {showForm && (
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
            onClick={resetForm}
            title="Close form"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}

        {!isManager && stores?.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm w-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            You need to create at least one store before adding products.
            <a href="/inventory/stores" className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 ml-1">Create a store</a>
          </div>
        )}

        {/* Low Stock Warning */}
        {lowStockProducts.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 w-full">
            <div className="text-amber-600 dark:text-amber-400 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <strong>Low Stock Alert!</strong>
              <span>{lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock</span>
            </div>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-fade-in" onClick={() => setShowStockModal(null)}>
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-gray-50">Update Stock</h2>
              <button type="button" className="p-1.5 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors" onClick={() => setShowStockModal(null)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-gray-300">Product: <strong className="text-slate-900 dark:text-gray-50">{showStockModal.name}</strong></p>
              <p className="text-sm text-slate-600 dark:text-gray-300">Current Stock: <strong className="text-slate-900 dark:text-gray-50">{showStockModal.quantity}</strong></p>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Stock Change</label>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                    onClick={() => setStockChange({ ...stockChange, quantity: stockChange.quantity - 1 })}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 text-center focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    value={stockChange.quantity}
                    onChange={(e) => setStockChange({ ...stockChange, quantity: parseInt(e.target.value) || 0 })}
                  />
                  <button
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                    onClick={() => setStockChange({ ...stockChange, quantity: stockChange.quantity + 1 })}
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  New stock will be: {Math.max(0, showStockModal.quantity + stockChange.quantity)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Reason (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={stockChange.reason}
                  onChange={(e) => setStockChange({ ...stockChange, reason: e.target.value })}
                  placeholder="e.g., Restock, Damaged, etc."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700" onClick={() => setShowStockModal(null)}>
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  onClick={handleStockUpdate}
                  disabled={stockChange.quantity === 0}
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-5 shadow-card animate-fade-in-up" ref={formCardRef}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-50 mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Product Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., iPhone Screen"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">SKU</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., IPH-SCR-001"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Barcode</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g., 123456789012"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Category</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {!isManager ? (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Store *</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    value={formData.storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    required
                  >
                    <option value="">Select store</option>
                    {availableStores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Store *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50"
                    value={managerStoreName || 'Unassigned'}
                    readOnly
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    Managers can only manage products in their assigned store.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Selling Price *</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Cost Price</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Initial Quantity</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Low Stock Threshold</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  placeholder="10"
                  min="0"
                />
              </div>

              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Description</label>
                <textarea
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-y"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" disabled={submitting}>
                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex items-center flex-1 min-w-[200px]">
          <svg className="absolute left-3 text-slate-400 dark:text-gray-500 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!isManager && (
          <select
            className="px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
          >
            <option value="">All Stores</option>
            {availableStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        )}

        {(isManager && managerStoreId) || (!isManager && stores?.length > 0) ? (
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreateForm}>
            + Add Product
          </button>
        ) : null}
      </div>

      {/* Products List */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-50">Products</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 dark:text-gray-500">Loading products...</div>
        ) : error ? (
          <div className="flex items-center justify-center p-12 text-red-600 dark:text-red-400">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-gray-500 space-y-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300">No products found</h3>
            <p className="text-sm">{searchTerm ? 'Try a different search term' : 'Add your first product to get started'}</p>
            {!searchTerm && stores?.length > 0 && (
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white mt-2" onClick={openCreateForm}>
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Stock Status</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredProducts.map((product) => {
                  const stock = product.quantity || 0;
                  const threshold = product.lowStockThreshold || 10;
                  let stockStatusClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
                  let stockLabel = 'In Stock';

                  if (stock === 0) {
                    stockStatusClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
                    stockLabel = 'Out of Stock';
                  } else if (stock <= threshold) {
                    stockStatusClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                    stockLabel = 'Low Stock';
                  }

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-gray-50">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 line-clamp-1">{product.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-slate-500 dark:text-gray-400 font-mono text-xs">{product.sku || '-'}</span>
                      </td>
                      <td className="px-5 py-3">
                        {product.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300">{product.category}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{product.storeName || 'Unknown'}</span>
                      </td>
                      <td className="text-right px-5 py-3">
                        <span className="font-semibold text-slate-900 dark:text-gray-50">{formatCurrency(product.price)}</span>
                      </td>
                      <td className="text-center px-5 py-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${stockStatusClass}`}>
                            {stockLabel}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-gray-500">({stock} units)</span>
                        </div>
                      </td>
                      <td className="text-center px-5 py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            onClick={() => {
                              setShowStockModal(product);
                              setStockChange({ quantity: 0, reason: '' });
                            }}
                            title="Update Stock"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                              <line x1="3" y1="6" x2="21" y2="6"/>
                              <line x1="12" y1="10" x2="12" y2="18"/>
                              <line x1="8" y1="14" x2="16" y2="14"/>
                            </svg>
                          </button>
                          <button
                            className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            onClick={() => handleEdit(product)}
                            title="Edit"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Delete"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
