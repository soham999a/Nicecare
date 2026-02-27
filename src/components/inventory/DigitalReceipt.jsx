import { useRef, useEffect, useState } from 'react';

// Confetti particle component
function Confetti() {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const newParticles = [];
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        shape: Math.random() > 0.5 ? 'circle' : 'square',
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`confetti-particle ${p.shape}`}
          style={{
            '--x': `${p.x}%`,
            '--size': `${p.size}px`,
            '--color': p.color,
            '--rotation': `${p.rotation}deg`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function DigitalReceipt({ sale, storeName, onClose }) {
  const receiptRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(true);

  // Handle Escape key to close
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  function handlePrint() {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-header h1 {
              font-size: 18px;
              margin: 0 0 5px 0;
            }
            .receipt-header p {
              margin: 2px 0;
              font-size: 12px;
            }
            .receipt-items {
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 12px;
            }
            .item-name {
              flex: 1;
            }
            .receipt-totals {
              margin-bottom: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 12px;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .receipt-footer {
              text-align: center;
              font-size: 11px;
              margin-top: 15px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function handleDownload() {
    const content = `
RECEIPT
=====================================
${storeName || 'Store'}
Date: ${formatDate(sale.createdAt)}
Receipt #: ${sale.id?.slice(-8).toUpperCase()}
=====================================

ITEMS:
${sale.items.map(item => 
  `${item.productName}
  ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`
).join('\n')}

-------------------------------------
Subtotal: ${formatCurrency(sale.subtotal)}
Tax: ${formatCurrency(sale.tax)}
-------------------------------------
TOTAL: ${formatCurrency(sale.total)}
-------------------------------------

Payment: ${sale.paymentMethod}
Customer: ${sale.customerName || 'Walk-in Customer'}

=====================================
Thank you for your purchase!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${sale.id?.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="modal-overlay sale-complete-overlay" onClick={onClose}>
      {showConfetti && <Confetti />}
      
      <div className="modal receipt-modal sale-complete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          className="receipt-close-btn" 
          onClick={onClose}
          aria-label="Close receipt"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Success Animation Header */}
        <div className="sale-complete-header">
          <div className="success-icon-wrapper">
            <div className="success-icon-ring"></div>
            <div className="success-icon-ring ring-2"></div>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" className="checkmark-path"/>
              </svg>
            </div>
          </div>
          <h2 className="sale-complete-title">Sale Complete!</h2>
          <p className="sale-complete-subtitle">Transaction processed successfully</p>
        </div>

        <div className="receipt-container modern-receipt" ref={receiptRef}>
          {/* Store Info */}
          <div className="receipt-store-info">
            <div className="store-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3 className="store-name">{storeName || 'Store'}</h3>
            <p className="receipt-date">{formatDate(sale.createdAt)}</p>
            <div className="receipt-number">
              <span className="label">Receipt</span>
              <span className="value">#{sale.id?.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          {/* Items Section */}
          <div className="receipt-items modern-items">
            <div className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Items Purchased
            </div>
            {sale.items.map((item, index) => (
              <div key={index} className="receipt-item modern-item">
                <div className="item-info">
                  <span className="item-name">{item.productName}</span>
                  <span className="item-meta">{item.quantity} × {formatCurrency(item.price)}</span>
                </div>
                <span className="item-total">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="receipt-totals modern-totals">
            <div className="total-row">
              <span className="label">Subtotal</span>
              <span className="value">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="total-row">
              <span className="label">Tax</span>
              <span className="value">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="total-row grand-total">
              <span className="label">Total</span>
              <span className="value">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="receipt-payment modern-payment">
            <div className="payment-method-badge">
              <div className="payment-icon">
                {sale.paymentMethod === 'Cash' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
                {sale.paymentMethod === 'Card' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
                {sale.paymentMethod === 'UPI' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                )}
              </div>
              <div className="payment-details">
                <span className="payment-label">Paid via</span>
                <span className="payment-value">{sale.paymentMethod}</span>
              </div>
            </div>
            {sale.customerName && sale.customerName !== 'Walk-in Customer' && (
              <div className="customer-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{sale.customerName}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer modern-footer">
            <div className="thank-you-message">
              <span className="emoji">🎉</span>
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions modern-actions">
          <button className="action-btn print-btn" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Print</span>
          </button>
          <button className="action-btn download-btn" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download</span>
          </button>
          <button className="action-btn new-sale-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
}
