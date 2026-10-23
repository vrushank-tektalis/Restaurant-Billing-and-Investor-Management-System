import React, { useState, useEffect } from 'react';
import { fetchAdminDashboard } from '../services/adminApi';
import '../admin.css';
import '../../investor/investor.css';

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="billing-alert billing-alert-error">⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className="page-container admin-container">
      <div className="admin-header-row">
        <div className="admin-header-title">
          <h2>👑 Restaurant Owner Dashboard</h2>
          <p>Manage your restaurant’s sales, investors, menu, and operations</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onNavigate && (
            <>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => onNavigate('billing')}
              >
                🧾 Cashier POS
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => onNavigate('menu')}
              >
                📋 Menu
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => onNavigate('investors')}
              >
                👥 Investors
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">Completed Sales</span>
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>
            ₹{Number(data?.total_completed_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="stat-hint">Total cashier orders revenue</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Invested Capital</span>
          <span className="stat-value" style={{ color: 'var(--color-accent-text)' }}>
            ₹{Number(data?.total_investment_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="stat-hint">Total investor capital</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Registered Investors</span>
          <span className="stat-value">{data?.total_investors || 0}</span>
          <span className="stat-hint">Active investor profiles</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Menu Offerings</span>
          <span className="stat-value">{data?.total_menu_items || 0}</span>
          <span className="stat-hint">Food &amp; beverage items</span>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="admin-activity-grid">
        {/* Recent Orders */}
        <div className="card-section">
          <div className="section-header">
            <h3 className="section-title">🧾 Recent Billing Orders</h3>
            {onNavigate && (
              <button
                type="button"
                className="btn-view-order"
                onClick={() => onNavigate('history')}
              >
                All Orders →
              </button>
            )}
          </div>

          {(!data?.recent_orders || data.recent_orders.length === 0) ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No recent orders.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.id}>
                    <td><span className="bill-badge">{o.bill_number}</span></td>
                    <td>{new Date(o.order_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`payment-badge ${o.payment_method === 'Cash' ? 'payment-badge-cash' : 'payment-badge-upi'}`}>
                        {o.payment_method}
                      </span>
                    </td>
                    <td><strong>₹{Number(o.total_amount).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Investments */}
        <div className="card-section">
          <div className="section-header">
            <h3 className="section-title">💼 Recent Investments</h3>
            {onNavigate && (
              <button
                type="button"
                className="btn-view-order"
                onClick={() => onNavigate('investments')}
              >
                All Investments →
              </button>
            )}
          </div>

          {(!data?.recent_investments || data.recent_investments.length === 0) ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No recent investments.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_investments.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.investor_name}</strong></td>
                    <td style={{ color: 'var(--color-accent-text)', fontWeight: 700 }}>
                      ₹{Number(inv.investment_amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`profile-badge ${inv.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
