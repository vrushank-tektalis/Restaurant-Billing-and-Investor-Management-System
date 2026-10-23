import React, { useState, useEffect } from 'react';
import { fetchInvestorInvestments } from '../services/investorApi';
import '../investor.css';

export default function InvestmentDetails() {
  const [investments, setInvestments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInvestments() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInvestorInvestments();
        const list = Array.isArray(data) ? data : [];
        setInvestments(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load investment details.');
      } finally {
        setLoading(false);
      }
    }

    loadInvestments();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading details...</p>
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

  if (investments.length === 0) {
    return (
      <div className="page-container">
        <div className="card-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No Investments Found</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>No investments recorded under your account.</p>
        </div>
      </div>
    );
  }

  const selectedInvestment = investments.find((i) => i.id === selectedId) || investments[0];
  const transactions = selectedInvestment?.transactions || [];
  const totalReturns = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return (
    <div className="page-container investor-container">
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)' }}>
            🔍 Investment Details &amp; Returns
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Detailed breakdown of capital and recorded historical distributions
          </p>
        </div>

        {/* Investment Selector dropdown */}
        {investments.length > 1 && (
          <div>
            <label htmlFor="inv-select" style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>
              Select Investment:
            </label>
            <select
              id="inv-select"
              className="menu-search-input"
              style={{ width: 'auto', display: 'inline-block', padding: '0.4rem 0.8rem' }}
              value={selectedId || ''}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {investments.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  Investment #{inv.id} (₹{Number(inv.investment_amount).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedInvestment && (
        <div className="card-section">
          <div className="section-header">
            <h3 className="section-title">
              Investment #{selectedInvestment.id}
            </h3>
            <span className={`profile-badge ${selectedInvestment.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
              {selectedInvestment.status}
            </span>
          </div>

          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <span className="stat-title">Investment ID</span>
              <span className="stat-value" style={{ fontSize: '1.25rem' }}>#{selectedInvestment.id}</span>
              <span className="stat-hint">Registered identifier</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Invested Capital</span>
              <span className="stat-value">
                ₹{Number(selectedInvestment.investment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="stat-hint">
                Invested on {new Date(selectedInvestment.investment_date).toLocaleDateString('en-IN')}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Total Returns To Date</span>
              <span className="stat-value positive">
                ₹{totalReturns.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="stat-hint">{transactions.length} Recorded Transactions</span>
            </div>
          </div>

          {selectedInvestment.notes && (
            <div style={{ background: 'var(--color-bg)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <strong>Investment Notes:</strong> {selectedInvestment.notes}
            </div>
          )}

          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
            💰 Recorded Distributions / Returns
          </h4>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
              No returns or dividend distributions recorded yet for this investment.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>#{tx.id}</td>
                    <td>{new Date(tx.transaction_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className="profile-badge badge-active" style={{ fontSize: '0.75rem' }}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td>
                      <code style={{ background: 'var(--color-bg)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        {tx.reference || 'N/A'}
                      </code>
                    </td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                      + ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {tx.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
