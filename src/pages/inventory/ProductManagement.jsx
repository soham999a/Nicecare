import { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useStores } from '../../hooks/useStores';
import InventoryNavbar from '../../components/inventory/InventoryNavbar';

export default function ProductManagement() {
  const [filterStore, setFilterStore] = useState('');
  const { products, loading, error, lowStockProducts, addProduct, updateProduct, updateStock, deleteProduct } = useProducts(filterStore || null);
  const { stores } = useStores();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(null);
  const [stockChange, setStockChange] = useState({ quantity: 0, reason: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    lowStockThreshold: '10',
    storeId: '',
    storeName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      description: '',
      price: '',
      cost: '',
      quantity: '',
      lowStockThreshold: '10',
      storeId: '',
      storeName: '',
    });
    setEditingProduct(null);
    setShowForm(false);
    setFormError('');
  }

  function handleStoreChange(storeId) {
    const store = stores.find(s => s.id === storeId);
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
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProduct(productId);
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
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
    <div className="inventory-dashboard">
      <InventoryNavbar />
      
      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Product Management</h1>
            <p>Manage your product catalog and inventory</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={stores.length === 0}
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {stores.length === 0 && (
          <div className="alert alert-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            You need to create at least one store before adding products.
            <a href="/inventory/stores" className="alert-link">Create a store</a>
          </div>
        )}

        {/* Low Stock Warning */}
        {lowStockProducts.length > 0 && (
          <div className="alert alert-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock!
          </div>
        )}

        {/* Stock Update Modal */}
        {showStockModal && (
          <div className="modal-overlay">
            <div className="modal stock-modal">
              <div className="modal-header">
                <h2>Update Stock</h2>
                <button className="close-btn" onClick={() => setShowStockModal(null)}>×</button>
              </div>
              <div className="modal-body">
                <p>Product: <strong>{showStockModal.name}</strong></p>
                <p>Current Stock: <strong>{showStockModal.quantity}</strong></p>
                
                <div className="form-group">
                  <label className="label">Stock Change</label>
                  <div className="stock-input-group">
                    <button 
                      className="btn btn-outline"
                      onClick={() => setStockChange({ ...stockChange, quantity: stockChange.quantity - 1 })}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="input"
                      value={stockChange.quantity}
                      onChange={(e) => setStockChange({ ...stockChange, quantity: parseInt(e.target.value) || 0 })}
                    />
                    <button 
                      className="btn btn-outline"
                      onClick={() => setStockChange({ ...stockChange, quantity: stockChange.quantity + 1 })}
                    >
                      +
                    </button>
                  </div>
                  <span className="input-hint">
                    New stock will be: {Math.max(0, showStockModal.quantity + stockChange.quantity)}
                  </span>
                </div>

                <div className="form-group">
                  <label className="label">Reason (optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={stockChange.reason}
                    onChange={(e) => setStockChange({ ...stockChange, reason: e.target.value })}
                    placeholder="e.g., Restock, Damaged, etc."
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowStockModal(null)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleStockUpdate}
                  disabled={stockChange.quantity === 0}
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card form-card">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            
            {formError && (
              <div className="alert alert-error">{formError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid three-col">
                <div className="form-group">
                  <label className="label">Product Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., iPhone Screen"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">SKU</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., IPH-SCR-001"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Barcode</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g., 123456789012"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Category</label>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Store *</label>
                  <select
                    className="select"
                    value={formData.storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    required
                  >
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Selling Price *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Cost Price</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Initial Quantity</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Low Stock Threshold</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    placeholder="10"
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="label">Description</label>
                  <textarea
                    className="textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Store:</label>
            <select
              className="select"
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products List */}
        <div className="card">
          <div className="card-header">
            <h2>Products</h2>
            <span className="badge">{filteredProducts.length} products</span>
          </div>

          {loading ? (
            <div className="loading-state">Loading products...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <h3>No products found</h3>
              <p>{searchTerm ? 'Try a different search term' : 'Add your first product to get started'}</p>
              {!searchTerm && stores.length > 0 && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  + Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Store</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const isLowStock = product.quantity <= (product.lowStockThreshold || 10);
                    return (
                      <tr key={product.id} className={isLowStock ? 'low-stock-row' : ''}>
                        <td>
                          <div className="product-cell">
                            <strong>{product.name}</strong>
                            {product.description && (
                              <span className="product-desc">{product.description}</span>
                            )}
                          </div>
                        </td>
                        <td>{product.sku || '-'}</td>
                        <td>
                          {product.category ? (
                            <span className="category-badge">{product.category}</span>
                          ) : '-'}
                        </td>
                        <td>
                          <span className="store-badge">{product.storeName || 'Unknown'}</span>
                        </td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          <span className={`stock-badge ${isLowStock ? 'low' : 'normal'}`}>
                            {product.quantity}
                            {isLowStock && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                            )}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-icon" 
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
                              className="btn-icon" 
                              onClick={() => handleEdit(product)}
                              title="Edit"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button 
                              className="btn-icon danger" 
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
    </div>
  );
}
