import React, { useState, useEffect } from 'react';
import { fetchInvestorInvestments } from '../services/investorApi';
import '../investor.css';

export default function InvestmentHistory() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInvestorInvestments();
        setInvestments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load investment history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredInvestments = investments.filter((inv) => {
    const matchesStatus =
      statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesSearch =
      !searchTerm ||
      inv.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page-container investor-container">
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)' }}>
            📜 Complete Investment History
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Historical record of your equity and debt venture investments
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="menu-search-input"
          style={{ maxWidth: '320px' }}
          placeholder="🔍 Search venture by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status:</span>
          {['ALL', 'ACTIVE', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`nav-btn ${statusFilter === st ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                color: statusFilter === st ? 'var(--color-accent-contrast)' : 'var(--color-text-muted)',
                borderColor: 'var(--color-border)',
              }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="card-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ width: 28, height: 28 }}></div>
            <p style={{ marginTop: '0.75rem' }}>Loading records...</p>
          </div>
        ) : error ? (
          <div className="billing-alert billing-alert-error">⚠️ {error}</div>
        ) : filteredInvestments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No investments matched the selected criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredInvestments.map((inv) => {
              const isExpanded = expandedId === inv.id;
              const txs = inv.transactions || [];
              const totalRet = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

              return (
                <div
                  key={inv.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    background: 'var(--color-surface)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                          {inv.restaurant_name}
                        </h3>
                        <span className={`profile-badge ${inv.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                          {inv.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        Invested Date: {new Date(inv.investment_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </p>
                      {inv.notes && <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '0.35rem' }}>{inv.notes}</p>}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Capital Amount</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        ₹{Number(inv.investment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.2rem' }}>
                        Returns: ₹{totalRet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {txs.length} transaction{txs.length === 1 ? '' : 's'} recorded
                    </span>
                    <button
                      type="button"
                      className="btn-view-order"
                      onClick={() => toggleExpand(inv.id)}
                    >
                      {isExpanded ? 'Hide Transactions ▲' : 'Show Transactions ▼'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="returns-box">
                      <div className="returns-title">Transaction Ledger</div>
                      {txs.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No transactions recorded for this investment.</p>
                      ) : (
                        <table className="data-table" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Reference</th>
                              <th>Amount</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {txs.map((tx) => (
                              <tr key={tx.id}>
                                <td>{new Date(tx.transaction_date).toLocaleDateString('en-IN')}</td>
                                <td><span className="profile-badge badge-active" style={{ fontSize: '0.72rem' }}>{tx.transaction_type}</span></td>
                                <td><code>{tx.reference || '—'}</code></td>
                                <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                                  + ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td>{tx.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
