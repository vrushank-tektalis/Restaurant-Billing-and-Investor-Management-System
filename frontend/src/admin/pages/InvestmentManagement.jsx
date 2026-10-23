import React, { useState, useEffect } from 'react';
import {
  fetchAdminInvestments,
  fetchAdminInvestors,
  createAdminInvestment,
  updateAdminInvestment,
  createAdminTransaction,
} from '../services/adminApi';
import '../admin.css';

function getLocalDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function InvestmentManagement() {
  const [investments, setInvestments] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [investorFilter, setInvestorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddInvModal, setShowAddInvModal] = useState(false);
  const [addInvForm, setAddInvForm] = useState({
    investor_id: '',
    investment_amount: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [activeTxInvestment, setActiveTxInvestment] = useState(null);
  const [txForm, setTxForm] = useState({
    transaction_type: 'RETURN',
    amount: '',
    reference: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invList, invs] = await Promise.all([
        fetchAdminInvestments(),
        fetchAdminInvestors(),
      ]);
      setInvestments(Array.isArray(invList) ? invList : []);
      setInvestors(Array.isArray(invs) ? invs : []);
      if (invs.length > 0 && !addInvForm.investor_id) {
        setAddInvForm((prev) => ({ ...prev, investor_id: invs[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load investments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvestment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        investor_id: Number(addInvForm.investor_id),
        investment_amount: Number(addInvForm.investment_amount),
        status: addInvForm.status,
        notes: addInvForm.notes.trim() || null,
      };
      await createAdminInvestment(payload);
      setShowAddInvModal(false);
      setAddInvForm({
        investor_id: investors[0]?.id || '',
        investment_amount: '',
        status: 'ACTIVE',
        notes: '',
      });
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to record investment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    if (!activeTxInvestment) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        transaction_type: txForm.transaction_type,
        amount: Number(txForm.amount),
        reference: txForm.reference.trim() || null,
        notes: txForm.notes.trim() || null,
      };
      await createAdminTransaction(activeTxInvestment.id, payload);
      setActiveTxInvestment(null);
      setTxForm({ transaction_type: 'RETURN', amount: '', reference: '', notes: '' });
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to record return transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (inv) => {
    const nextStatus = inv.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
    try {
      const updated = await updateAdminInvestment(inv.id, { status: nextStatus });
      setInvestments((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const filteredInvestments = investments.filter((investment) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search
      || String(investment.investor_name || '').toLowerCase().includes(search)
      || (investment.notes || '').toLowerCase().includes(search);
    const matchesInvestor = investorFilter === 'ALL'
      || String(investment.investor_id) === investorFilter;
    const matchesStatus = statusFilter === 'ALL' || investment.status === statusFilter;
    const investmentDate = getLocalDateKey(investment.investment_date);
    return matchesSearch
      && matchesInvestor
      && matchesStatus
      && (!startDate || (investmentDate && investmentDate >= startDate))
      && (!endDate || (investmentDate && investmentDate <= endDate));
  });

  return (
    <div className="page-container admin-container">
      <div className="admin-header-row">
        <div className="admin-header-title">
          <h2>💼 Investment Portfolios &amp; Returns</h2>
          <p>Record capital investments and actual profit distributions / returns</p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={() => {
            setModalError(null);
            setShowAddInvModal(true);
          }}
        >
          ➕ Record New Investment
        </button>
      </div>

      {error && <div className="billing-alert billing-alert-error">⚠️ {error}</div>}

      <div className="admin-filter-toolbar">
        <input
          type="search"
          className="form-input"
          placeholder="Search investor or notes"
          aria-label="Search investments"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-input"
          aria-label="Filter investments by investor"
          value={investorFilter}
          onChange={(e) => setInvestorFilter(e.target.value)}
        >
          <option value="ALL">All investors</option>
          {investors.map((investor) => (
            <option key={investor.id} value={investor.id}>{investor.name}</option>
          ))}
        </select>
        <select
          className="form-input"
          aria-label="Filter investments by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input
          type="date"
          className="form-input"
          aria-label="Investments from date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="form-input"
          aria-label="Investments to date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        {(searchTerm || investorFilter !== 'ALL' || statusFilter !== 'ALL' || startDate || endDate) && (
          <button
            type="button"
            className="btn-view-order"
            onClick={() => {
              setSearchTerm('');
              setInvestorFilter('ALL');
              setStatusFilter('ALL');
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="card-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ width: 28, height: 28 }}></div>
            <p style={{ marginTop: '0.75rem' }}>Loading investments...</p>
          </div>
        ) : investments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No investments recorded yet.
          </div>
        ) : filteredInvestments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No investments matched the selected filters.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Capital Invested</th>
                <th>Date</th>
                <th>Status</th>
                <th>Recorded Returns</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.investor_name}</strong>
                    {inv.notes && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{inv.notes}</div>}
                  </td>
                  <td style={{ color: 'var(--color-text)', fontWeight: 700 }}>
                    ₹{Number(inv.investment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>{new Date(inv.investment_date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleToggleStatus(inv)}
                      title="Click to toggle status"
                    >
                      <span className={`profile-badge ${inv.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                        {inv.status}
                      </span>
                    </button>
                  </td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                    ₹{Number(inv.total_returns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                      ({(inv.transactions || []).length} payouts)
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-view-order"
                      style={{ background: 'var(--color-success-bg)', color: 'var(--color-accent-text)', borderColor: 'var(--color-accent)' }}
                      onClick={() => {
                        setModalError(null);
                        setActiveTxInvestment(inv);
                      }}
                    >
                      💰 + Record Return
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Investment Modal */}
      {showAddInvModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddInvModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>➕ Record Capital Investment</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowAddInvModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInvestment}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="billing-alert billing-alert-error" style={{ margin: 0 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="inv-investor-select">Select Investor *</label>
                  <select
                    id="inv-investor-select"
                    className="form-input"
                    value={addInvForm.investor_id}
                    onChange={(e) => setAddInvForm({ ...addInvForm, investor_id: e.target.value })}
                    required
                  >
                    {investors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inv-amount">Investment Amount (₹) *</label>
                  <input
                    id="inv-amount"
                    type="number"
                    min="1000"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 500000"
                    value={addInvForm.investment_amount}
                    onChange={(e) => setAddInvForm({ ...addInvForm, investment_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inv-status">Status</label>
                  <select
                    id="inv-status"
                    className="form-input"
                    value={addInvForm.status}
                    onChange={(e) => setAddInvForm({ ...addInvForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inv-notes">Investment Agreement / Notes</label>
                  <textarea
                    id="inv-notes"
                    className="form-input"
                    rows="2"
                    placeholder="e.g. 10% equity share with quarterly profit dividend."
                    value={addInvForm.notes}
                    onChange={(e) => setAddInvForm({ ...addInvForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-view-order"
                  onClick={() => setShowAddInvModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Record Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Return / Distribution Modal */}
      {activeTxInvestment && (
        <div className="admin-modal-backdrop" onClick={() => setActiveTxInvestment(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>💰 Record Return / Distribution</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setActiveTxInvestment(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecordTransaction}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="billing-alert billing-alert-error" style={{ margin: 0 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <div style={{ background: 'var(--color-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                  <strong>Investment:</strong> #{activeTxInvestment.id} <br />
                  <strong>Investor:</strong> {activeTxInvestment.investor_name}
                </div>

                <div className="form-group">
                  <label htmlFor="tx-type">Transaction Type *</label>
                  <select
                    id="tx-type"
                    className="form-input"
                    value={txForm.transaction_type}
                    onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                  >
                    <option value="RETURN">RETURN (Profit Share)</option>
                    <option value="DISTRIBUTION">DISTRIBUTION (Capital / Dividend)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="tx-amount">Amount (₹) *</label>
                  <input
                    id="tx-amount"
                    type="number"
                    min="1"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 25000"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tx-ref">Payment Reference / Cheque No</label>
                  <input
                    id="tx-ref"
                    type="text"
                    className="form-input"
                    placeholder="e.g. TXN-2026-0042"
                    value={txForm.reference}
                    onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tx-notes">Description / Period Notes</label>
                  <input
                    id="tx-notes"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Q2 Profit Distribution payout."
                    value={txForm.notes}
                    onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-view-order"
                  onClick={() => setActiveTxInvestment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Disburse & Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
