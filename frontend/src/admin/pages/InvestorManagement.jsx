import React, { useState, useEffect } from 'react';
import {
  fetchAdminInvestors,
  createAdminInvestor,
  updateAdminInvestor,
} from '../services/adminApi';
import '../admin.css';

export default function InvestorManagement() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  // Modal State for Edit
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
    is_active: true,
    new_password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadInvestors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminInvestors();
      setInvestors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load investors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestors();
  }, []);

  const handleOpenEdit = (inv) => {
    setEditingInvestor(inv);
    setEditForm({
      name: inv.name,
      phone: inv.phone || '',
      address: inv.address || '',
      status: inv.status,
      is_active: inv.is_active,
      new_password: '',
    });
    setModalError(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      const created = await createAdminInvestor(addForm);
      setInvestors((prev) => [...prev, created]);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', phone: '', address: '' });
    } catch (err) {
      setModalError(err.message || 'Failed to create investor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const payload = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      status: editForm.status,
      is_active: Boolean(editForm.is_active),
    };
    if (editForm.new_password.trim()) {
      payload.new_password = editForm.new_password.trim();
    }

    try {
      const updated = await updateAdminInvestor(editingInvestor.id, payload);
      setInvestors((prev) =>
        prev.map((i) => (i.id === editingInvestor.id ? updated : i))
      );
      setEditingInvestor(null);
    } catch (err) {
      setModalError(err.message || 'Failed to update investor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container admin-container">
      <div className="admin-header-row">
        <div className="admin-header-title">
          <h2>👥 Investor Profiles &amp; Accounts</h2>
          <p>Register new investors, manage account access, and update profiles</p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={() => {
            setModalError(null);
            setShowAddModal(true);
          }}
        >
          ➕ Register New Investor
        </button>
      </div>

      {error && <div className="billing-alert billing-alert-error">⚠️ {error}</div>}

      <div className="card-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ width: 28, height: 28 }}></div>
            <p style={{ marginTop: '0.75rem' }}>Loading investors...</p>
          </div>
        ) : investors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No investors registered yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Login Access</th>
                <th>Total Invested</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{inv.email}</div>
                  </td>
                  <td>
                    <div>{inv.phone || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{inv.address || ''}</div>
                  </td>
                  <td>
                    <span className={`profile-badge ${inv.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <span className={`profile-badge ${inv.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {inv.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-accent-text)', fontWeight: 700 }}>
                    ₹{Number(inv.total_invested || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-view-order"
                      onClick={() => handleOpenEdit(inv)}
                    >
                      🖍
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Investor Modal */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>➕ Register New Investor</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="billing-alert billing-alert-error" style={{ margin: 0 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="inv-name">Full Name *</label>
                  <input
                    id="inv-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Kapoor"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inv-email">Email Address *</label>
                  <input
                    id="inv-email"
                    type="email"
                    className="form-input"
                    placeholder="investor@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inv-pass">Initial Password *</label>
                  <input
                    id="inv-pass"
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inv-phone">Phone Number</label>
                  <input
                    id="inv-phone"
                    type="text"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inv-address">Residential / Office Address</label>
                  <input
                    id="inv-address"
                    type="text"
                    className="form-input"
                    placeholder="City, State"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-view-order"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submitting}
                >
                  {submitting ? 'Registering...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Investor Modal */}
      {editingInvestor && (
        <div className="admin-modal-backdrop" onClick={() => setEditingInvestor(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>✏️ Manage Investor: {editingInvestor.name}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingInvestor(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="billing-alert billing-alert-error" style={{ margin: 0 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-name">Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-phone">Phone Number</label>
                  <input
                    id="edit-phone"
                    type="text"
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-address">Address</label>
                  <input
                    id="edit-address"
                    type="text"
                    className="form-input"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-status">Investor Status</label>
                  <select
                    id="edit-status"
                    className="form-input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    Enable Login Account Access
                  </span>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label htmlFor="edit-reset-pass">Reset Password (leave empty to keep unchanged)</label>
                  <input
                    id="edit-reset-pass"
                    type="password"
                    className="form-input"
                    placeholder="New password"
                    value={editForm.new_password}
                    onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-view-order"
                  onClick={() => setEditingInvestor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
