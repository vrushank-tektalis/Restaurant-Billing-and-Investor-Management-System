import React, { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchSalesReport, fetchInvestmentReport } from '../services/adminApi';
import '../admin.css';
import '../../investor/investor.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');

  // Sales Report State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState(null);

  // Investment Report State
  const [investData, setInvestData] = useState(null);
  const [loadingInvest, setLoadingInvest] = useState(false);
  const [investError, setInvestError] = useState(null);

  const salesChartData = (salesData?.daily_breakdown || []).map((row) => ({
    ...row,
    shortDate: new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));
  const sortedInvestorData = [...(investData?.investors || [])]
    .sort((left, right) => Number(right.total_invested) - Number(left.total_invested));
  const investorPieData = sortedInvestorData.slice(0, 6).map((investor) => ({
    name: investor.name,
    value: Number(investor.total_invested),
  }));
  if (sortedInvestorData.length > 6) {
    investorPieData.push({
      name: 'Other investors',
      value: sortedInvestorData.slice(6).reduce((sum, investor) => sum + Number(investor.total_invested), 0),
    });
  }

  const chartColors = [
    'var(--color-accent)',
    'var(--color-warning)',
    'var(--color-danger)',
    'var(--color-accent-text)',
    'var(--color-text-muted)',
    'var(--color-tint-3)',
    'var(--color-tint-1)',
  ];

  const loadSalesReport = async () => {
    setLoadingSales(true);
    setSalesError(null);
    try {
      const data = await fetchSalesReport(startDate, endDate);
      setSalesData(data);
    } catch (err) {
      setSalesError(err.message || 'Failed to load sales report.');
    } finally {
      setLoadingSales(false);
    }
  };

  const loadInvestmentReport = async () => {
    setLoadingInvest(true);
    setInvestError(null);
    try {
      const data = await fetchInvestmentReport();
      setInvestData(data);
    } catch (err) {
      setInvestError(err.message || 'Failed to load investment report.');
    } finally {
      setLoadingInvest(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSalesReport();
    } else {
      loadInvestmentReport();
    }
  }, [activeTab]);

  return (
    <div className="page-container admin-container">
      <div className="admin-header-row">
        <div className="admin-header-title">
          <h2>📊 Financial &amp; Operational Reports</h2>
          <p>Strictly segregated reports for Restaurant Sales Revenue vs. Investor Capital &amp; Returns</p>
        </div>
      </div>

      <div className="report-tabs">
        <button
          type="button"
          className={`report-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          🧾 Sales Revenue Report
        </button>
        <button
          type="button"
          className={`report-tab-btn ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          💼 Investor Capital &amp; Returns Report
        </button>
      </div>

      {/* ================= TAB 1: SALES REPORT ================= */}
      {activeTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Date Filter Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="sales-start">From Date:</label>
              <input
                id="sales-start"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="sales-end">To Date:</label>
              <input
                id="sales-end"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-primary-action"
              onClick={loadSalesReport}
            >
              Filter Report
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                className="btn-view-order"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Dates
              </button>
            )}
          </div>

          {salesError && <div className="billing-alert billing-alert-error">⚠️ {salesError}</div>}

          {/* Metric Highlights */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-title">Total Sales Revenue</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                ₹{Number(salesData?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="stat-hint">Period total from cashier orders</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Total Invoices / Orders</span>
              <span className="stat-value">{salesData?.total_orders_count || 0}</span>
              <span className="stat-hint">Completed cashier bills</span>
            </div>
          </div>

          <section className="report-chart-grid" aria-label="Sales charts">
            <div className="report-chart-panel">
              <h3 className="section-title">Daily revenue</h3>
              {salesChartData.length === 0 ? (
                <p className="report-chart-empty">No sales data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={salesChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="total_sales" name="Revenue" stroke="var(--color-accent)" fill="var(--color-tint-2)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="report-chart-panel">
              <h3 className="section-title">Orders by day</h3>
              {salesChartData.length === 0 ? (
                <p className="report-chart-empty">No orders for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={salesChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="orders_count" name="Orders" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Daily Sales Breakdown */}
          <div className="card-section">
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>📅 Daily Sales Breakdown</h3>
            {loadingSales ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ width: 28, height: 28 }}></div>
              </div>
            ) : (!salesData?.daily_breakdown || salesData.daily_breakdown.length === 0) ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                No completed sales recorded for this date range.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders Completed</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.daily_breakdown.map((row) => (
                    <tr key={row.date}>
                      <td><strong>{new Date(row.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong></td>
                      <td>{row.orders_count} orders</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                        ₹{Number(row.total_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: INVESTMENT REPORT ================= */}
      {activeTab === 'investments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {investError && <div className="billing-alert billing-alert-error">⚠️ {investError}</div>}

          {/* Metric Highlights */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-title">Total Capital Invested</span>
              <span className="stat-value" style={{ color: 'var(--color-accent-text)' }}>
                ₹{Number(investData?.total_invested_all || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="stat-hint">Across all registered investor portfolios</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Total Distributed Returns</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                ₹{Number(investData?.total_returns_all || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="stat-hint">Actual payouts &amp; dividends recorded</span>
            </div>
          </div>

          <div className="notice-banner">
            🛡️ <strong>Segregation Notice:</strong> Restaurant operations sales revenue is kept completely independent of investor equity capital and profit dividend distributions.
          </div>

          <section className="report-chart-grid" aria-label="Investment charts">
            <div className="report-chart-panel">
              <h3 className="section-title">Capital and returns by investor</h3>
              {!sortedInvestorData.length ? (
                <p className="report-chart-empty">No investor data to chart.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sortedInvestorData.slice(0, 10)} margin={{ top: 12, right: 12, left: 0, bottom: 24 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="total_invested" name="Capital invested" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_returns" name="Returns" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="report-chart-panel">
              <h3 className="section-title">Capital distribution</h3>
              {!investorPieData.length ? (
                <p className="report-chart-empty">No capital distribution to chart.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={investorPieData} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius={88} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {investorPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <div className="card-section">
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>👥 Investor Portfolio Summary</h3>
            {loadingInvest ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ width: 28, height: 28 }}></div>
              </div>
            ) : (!investData?.investors || investData.investors.length === 0) ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                No investor portfolio records found.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Investor Name</th>
                    <th>Email</th>
                    <th>Investments</th>
                    <th>Total Capital Invested</th>
                    <th>Total Returns Distributed</th>
                    <th>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {investData.investors.map((inv) => (
                    <tr key={inv.investor_id}>
                      <td><strong>{inv.name}</strong></td>
                      <td>{inv.email}</td>
                      <td>{inv.investments_count} investment{inv.investments_count === 1 ? '' : 's'}</td>
                      <td style={{ color: 'var(--color-accent-text)', fontWeight: 700 }}>
                        ₹{Number(inv.total_invested).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                        ₹{Number(inv.total_returns).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontWeight: 700, color: inv.net_position >= 0 ? 'var(--color-success)' : 'var(--color-danger-text)' }}>
                        {inv.net_position >= 0 ? '+' : ''}₹{Number(inv.net_position).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
