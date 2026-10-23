import React, { useState, useEffect } from 'react';
import ReceiptModal from '../components/ReceiptModal';
import { fetchOrders, fetchOrderById } from '../services/billingApi';
import './HistoryPage.css';

export default function HistoryPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state for viewing order details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrders();
        if (!isCancelled) {
          const list = Array.isArray(data) ? data : data?.orders || [];
          setOrders(list);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load billing history.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleViewOrder = async (orderSummary) => {
    const orderId = orderSummary.id || orderSummary.bill_no;
    setLoadingOrderId(orderId);
    try {
      const fullOrder = await fetchOrderById(orderId);
      setSelectedOrder(fullOrder);
    } catch {
      // Fallback: If fetchOrderById fails or backend only has flat list, use summary item
      setSelectedOrder(orderSummary);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="history-header">
        <div className="history-title-group">
          <h2>📜 Billing History</h2>
          <p>View previous customer orders and receipts</p>
        </div>
        <button
          type="button"
          className="btn-new-bill-nav"
          onClick={() => onNavigate && onNavigate('billing')}
        >
          ➕ New Bill
        </button>
      </div>

      <div className="history-table-card">
        {loading ? (
          <div className="history-state-container">
            <div className="spinner" style={{ width: 28, height: 28 }}></div>
            <p style={{ marginTop: '1rem' }}>Loading billing records...</p>
          </div>
        ) : error ? (
          <div className="history-state-container history-error-state">
            <div className="history-state-icon">⚠️</div>
            <p><strong>Error:</strong> {error}</p>
            <button
              type="button"
              className="btn-view-order"
              style={{ marginTop: '1rem' }}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="history-state-container">
            <div className="history-state-icon">🧾</div>
            <h3>No Billing Records Found</h3>
            <p>Generated bills will appear in this history list.</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date &amp; Time</th>
                <th>Payment Method</th>
                <th>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const billId = order.id || idx + 1;
                const billNo = order.bill_no || order.bill_number || `#${billId}`;
                const rawDate = order.order_date || order.created_at || order.createdAt || order.date;
                const formattedDate = rawDate
                  ? new Date(rawDate).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'N/A';
                const totalAmount = Number(order.total_amount ?? order.total ?? 0).toFixed(2);
                const paymentMethod = order.payment_method || order.paymentMethod || 'Cash';
                const paymentClass =
                  paymentMethod.toLowerCase() === 'cash'
                    ? 'payment-badge-cash'
                    : paymentMethod.toLowerCase() === 'upi'
                    ? 'payment-badge-upi'
                    : 'payment-badge-other';

                return (
                  <tr key={order.id || idx}>
                    <td>
                      <span className="bill-badge">{billNo}</span>
                    </td>
                    <td>{formattedDate}</td>
                    <td>
                      <span className={`payment-badge ${paymentClass}`}>
                        {paymentMethod}
                      </span>
                    </td>
                    <td>
                      <strong>₹{totalAmount}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-view-order"
                        disabled={loadingOrderId === billId}
                        onClick={() => handleViewOrder(order)}
                      >
                        {loadingOrderId === billId ? 'Loading...' : '👁'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for viewing order */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
