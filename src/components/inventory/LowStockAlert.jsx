import { Link } from 'react-router-dom';

export default function LowStockAlert({ products }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="low-stock-alert">
      <div className="alert-header">
        <div className="alert-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div className="alert-title">
          <h3>Low Stock Alert</h3>
          <p>{products.length} product{products.length !== 1 ? 's' : ''} running low</p>
        </div>
        <Link to="/inventory/products" className="alert-action">
          View All
        </Link>
      </div>
      <div className="low-stock-list">
        {products.slice(0, 5).map((product) => (
          <div key={product.id} className="low-stock-item">
            <span className="product-name">{product.name}</span>
            <span className="product-sku">{product.sku || 'No SKU'}</span>
            <span className="product-quantity critical">
              {product.quantity} left
            </span>
          </div>
        ))}
        {products.length > 5 && (
          <div className="more-items">
            +{products.length - 5} more items
          </div>
        )}
      </div>
    </div>
  );
}
