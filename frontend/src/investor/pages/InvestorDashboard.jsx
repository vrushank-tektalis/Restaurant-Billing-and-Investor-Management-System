import React, { useState, useEffect } from 'react';
import { fetchInvestorProfile, fetchInvestorSummary, fetchInvestorInvestments } from '../services/investorApi';
import '../investor.css';

export default function InvestorDashboard({ onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profData, sumData, invData] = await Promise.all([
          fetchInvestorProfile(),
          fetchInvestorSummary(),
          fetchInvestorInvestments(),
        ]);
        if (!isCancelled) {
          setProfile(profData);
          setSummary(sumData);
          setInvestments(invData || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load dashboard data.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading investor dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="billing-alert billing-alert-error" role="alert">
          <span>⚠️ {error}</span>
          <button type="button" className="billing-alert-close" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container investor-container">
      {/* Profile Card */}
      {profile && (
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'I'}
            </div>
            <div className="profile-details">
              <h2>{profile.name}</h2>
              <p>✉️ {profile.email} {profile.phone && `• 📞 ${profile.phone}`}</p>
              {profile.address && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📍 {profile.address}</p>}
            </div>
          </div>
          <span className={`profile-badge ${profile.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
            {profile.status}
          </span>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">Total Capital Invested</span>
          <span className="stat-value">₹{Number(summary?.total_invested || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="stat-hint">{summary?.total_investments_count || 0} Total Investments</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Recorded Returns</span>
          <span className="stat-value positive">₹{Number(summary?.total_returns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="stat-hint">Actual payouts &amp; distributions</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Active Investments</span>
          <span className="stat-value" style={{ color: 'var(--color-accent-text)' }}>{summary?.active_investments_count || 0}</span>
          <span className="stat-hint">Active ventures</span>
        </div>
      </div>

      <div className="notice-banner">
        ℹ️ Financial returns displayed are actual historical records. No speculative or guaranteed returns are projected.
      </div>

      {/* Recent Investments Preview */}
      <div className="card-section">
        <div className="section-header">
          <h3 className="section-title">💼 My Investments</h3>
          {onNavigate && (
            <button
              type="button"
              className="btn-view-order"
              onClick={() => onNavigate('history')}
            >
              View Full History →
            </button>
          )}
        </div>

        {investments.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            No investment records currently registered for your account.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Venture / Restaurant</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Returns To Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => {
                const totalRet = (inv.transactions || []).reduce((s, t) => s + Number(t.amount || 0), 0);
                const formattedDate = new Date(inv.investment_date).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr key={inv.id}>
                    <td>
                      <strong>{inv.restaurant_name}</strong>
                      {inv.notes && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{inv.notes}</p>}
                    </td>
                    <td>
                      <strong>₹{Number(inv.investment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td>{formattedDate}</td>
                    <td>
                      <span className={`profile-badge ${inv.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                      ₹{totalRet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
