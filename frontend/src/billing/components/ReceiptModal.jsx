import React from 'react';
import './ReceiptModal.css';

/**
 * ReceiptModal Component
 * Displays a printed-style bill/receipt in a modal overlay with Print and Close buttons.
 * Includes @media print style to isolate receipt contents on print.
 */
export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const rawDate = order.order_date || order.created_at || order.createdAt || order.date;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN');

  const billNo = order.bill_no || order.bill_number || order.order_number || (order.id ? `#${order.id}` : 'N/A');
  const items = order.items || order.order_items || [];
  const subtotal = Number(order.subtotal || 0).toFixed(2);
  const discount = Number(order.discount || 0).toFixed(2);
  const taxAmount = Number(order.tax_amount ?? order.tax ?? 0).toFixed(2);
  const taxPercent = order.tax_percent != null ? order.tax_percent : null;
  const totalAmount = Number(order.total_amount ?? order.total ?? 0).toFixed(2);
  const paymentMethod = order.payment_method || order.paymentMethod || 'Cash';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div
        className="receipt-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
      >
        <div className="receipt-paper">
          <div className="receipt-header">
            <h2 id="receipt-title" className="receipt-restaurant-name">
              🍽️ RESTAURANT BILLING
            </h2>
            <p className="receipt-subtitle">Tax Invoice / Cash Receipt</p>
          </div>

          <div className="receipt-meta">
            <div className="receipt-meta-row">
              <strong>Bill No:</strong>
              <span>{billNo}</span>
            </div>
            <div className="receipt-meta-row">
              <strong>Date &amp; Time:</strong>
              <span>{formattedDate}</span>
            </div>
            <div className="receipt-meta-row">
              <strong>Payment:</strong>
              <span>{paymentMethod}</span>
            </div>
          </div>

          <table className="receipt-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="th-qty">Qty</th>
                <th className="th-price">Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const qty = Number(it.quantity || 1);
                  const price = Number(it.unit_price ?? it.price ?? 0);
                  const lineTotal = Number(it.line_total ?? qty * price);
                  const itemName = it.name || it.item_name || `Item ${idx + 1}`;

                  return (
                    <tr key={it.id || idx}>
                      <td>{itemName}</td>
                      <td className="td-qty">{qty}</td>
                      <td className="td-price">₹{price.toFixed(2)}</td>
                      <td>₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="receipt-summary-section">
            <div className="receipt-summary-row">
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="receipt-summary-row" style={{ color: 'var(--color-success)' }}>
                <span>Discount:</span>
                <span>- ₹{discount}</span>
              </div>
            )}
            <div className="receipt-summary-row">
              <span>Tax {taxPercent != null ? `(${taxPercent}%)` : ''}:</span>
              <span>₹{taxAmount}</span>
            </div>
            <div className="receipt-summary-row receipt-summary-total">
              <span>Total Payable:</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <div className="receipt-footer-text">
            <p>Thank you for dining with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>

        <div className="receipt-actions no-print">
          <button type="button" className="btn-print" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
