import { useRef, useEffect, useState } from 'react';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time init
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[10001]">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute -top-5 opacity-0 animate-confetti-fall ${p.shape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
          style={{
            '--x': `${p.x}%`,
            '--size': `${p.size}px`,
            '--color': p.color,
            '--rotation': `${p.rotation}deg`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function DigitalReceipt({ sale, storeName, onClose }) {
  const receiptRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

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
Subtotal: ${formatCurrency(sale.baseSubtotal ?? sale.subtotal)}
${sale.discountAmount > 0 ? `Discount: -${formatCurrency(sale.discountAmount)}\n` : ''}Tax: ${formatCurrency(sale.tax)}
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-overlay-fade-in" onClick={onClose}>
      {showConfetti && <Confetti />}

      <div className="relative max-w-[480px] w-[95%] max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0f1a] dark:to-gray-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] animate-modal-pop-in" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 border border-slate-200 dark:border-gray-700 flex items-center justify-center cursor-pointer transition-all duration-200 z-10 text-slate-600 dark:text-gray-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 hover:rotate-90"
          onClick={onClose}
          aria-label="Close receipt"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="text-center pt-10 px-8 pb-6 bg-gradient-to-b from-emerald-500/10 to-transparent">
          <div className="relative w-[100px] h-[100px] mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 opacity-0 animate-ring-pulse"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 opacity-0 animate-ring-pulse [animation-delay:0.5s]"></div>
            <div className="absolute inset-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center animate-icon-bounce shadow-[0_10px_30px_rgba(16,185,129,0.4),0_0_0_8px_rgba(16,185,129,0.1)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                <polyline points="20 6 9 17 4 12" className="animate-draw-checkmark" style={{ strokeDasharray: 30, strokeDashoffset: 30 }} />
              </svg>
            </div>
          </div>
          <h2 className="text-[1.75rem] font-bold text-slate-900 dark:text-gray-50 mb-2 animate-text-slide-up [animation-delay:0.3s] [animation-fill-mode:both]">Sale Complete!</h2>
          <p className="text-base text-slate-600 dark:text-gray-400 animate-text-slide-up [animation-delay:0.4s] [animation-fill-mode:both]">Transaction processed successfully</p>
        </div>

        <div className="mx-6 bg-slate-50 dark:bg-[#0a0f1a] rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden animate-receipt-slide-up [animation-delay:0.4s] [animation-fill-mode:both]" ref={receiptRef}>
          <div className="text-center p-6 bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-[#0a0f1a] border-b border-dashed border-slate-200 dark:border-gray-700">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-600 to-violet-500 rounded-xl flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-gray-50 mb-1">{storeName || 'Store'}</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">{formatDate(sale.createdAt)}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-[20px] text-sm">
              <span className="text-slate-600 dark:text-gray-400">Receipt</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">#{sale.id?.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Items Purchased
            </div>
            {sale.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 mb-2 bg-white dark:bg-gray-900 rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[-4px_0_0_theme(colors.blue.600)]">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-900 dark:text-gray-50 text-[0.95rem]">{item.productName}</span>
                  <span className="text-[0.8rem] text-slate-600 dark:text-gray-400">{item.quantity} × {formatCurrency(item.price)}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-gray-50 text-base">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-dashed border-slate-200 dark:border-gray-700">
            <div className="flex justify-between py-2">
              <span className="text-slate-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-slate-900 dark:text-gray-50">{formatCurrency(sale.baseSubtotal ?? sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-emerald-600 dark:text-emerald-400">Discount</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-slate-600 dark:text-gray-400">Tax</span>
              <span className="font-medium text-slate-900 dark:text-gray-50">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-slate-200 dark:border-gray-700">
              <span className="text-lg font-bold text-slate-900 dark:text-gray-50">Total</span>
              <span className="text-xl font-extrabold text-emerald-500">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <div className="px-6 py-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl flex-1 min-w-[140px]">
              <div className="w-9 h-9 bg-blue-600 dark:bg-blue-400 rounded-lg flex items-center justify-center text-white">
                {sale.paymentMethod === 'Cash' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
                {sale.paymentMethod === 'Card' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
                {sale.paymentMethod === 'UPI' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-600 dark:text-gray-400">Paid via</span>
                <span className="font-semibold text-slate-900 dark:text-gray-50">{sale.paymentMethod}</span>
              </div>
            </div>
            {sale.customerName && sale.customerName !== 'Walk-in Customer' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl text-[0.9rem] text-slate-900 dark:text-gray-50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] text-slate-600 dark:text-gray-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{sale.customerName}</span>
              </div>
            )}
          </div>

          <div className="px-6 pt-4 pb-6 border-t border-dashed border-slate-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl animate-thank-you-pulse">
              <span className="text-2xl animate-emoji-bounce">🎉</span>
              <p className="font-semibold text-emerald-500 m-0">Thank you for your purchase!</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 animate-actions-slide-up [animation-delay:0.5s] [animation-fill-mode:both]">
          <button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0a0f1a] text-slate-900 dark:text-gray-50 font-semibold text-[0.85rem] cursor-pointer transition-all duration-200 hover:bg-white hover:dark:bg-gray-800 hover:border-blue-600 hover:text-blue-600" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Print</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0a0f1a] text-slate-900 dark:text-gray-50 font-semibold text-[0.85rem] cursor-pointer transition-all duration-200 hover:bg-white hover:dark:bg-gray-800 hover:border-violet-500 hover:text-violet-500" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold text-[0.85rem] cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
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
