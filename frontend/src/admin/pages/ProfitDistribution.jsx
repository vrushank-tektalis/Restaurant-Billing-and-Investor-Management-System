import React, { useEffect, useState } from 'react';
import {
  createExpense,
  deleteExpense,
  distributeProfit,
  fetchExpenses,
  previewProfitDistribution,
} from '../services/adminApi';
import '../admin.css';

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function ProfitDistribution() {
  const today = new Date();
  const [startDate, setStartDate] = useState(getDateKey(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(getDateKey(today));
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseError, setExpenseError] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(getDateKey(today));
  const [savingExpense, setSavingExpense] = useState(false);
  const [preview, setPreview] = useState(null);
  const [distributionResult, setDistributionResult] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [pageError, setPageError] = useState(null);

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    setExpenseError(null);
    try {
      const data = await fetchExpenses(startDate, endDate);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setExpenseError(err.message || 'Failed to load expenses.');
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [startDate, endDate]);

  const periodPayload = () => ({ start_date: startDate, end_date: endDate });

  const handlePreview = async () => {
    setLoadingPreview(true);
    setPageError(null);
    setDistributionResult(null);
    try {
      const data = await previewProfitDistribution(periodPayload());
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setPageError(err.message || 'Failed to calculate profit shares.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    setSavingExpense(true);
    setExpenseError(null);
    setPageError(null);
    try {
      await createExpense({
        description: description.trim(),
        amount: Number(amount),
        expense_date: expenseDate,
      });
      setDescription('');
      setAmount('');
      setPreview(null);
      setDistributionResult(null);
      await loadExpenses();
    } catch (err) {
      setExpenseError(err.message || 'Failed to record expense.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.description}" (${formatAmount(expense.amount)})?`)) {
      return;
    }
    setExpenseError(null);
    try {
      await deleteExpense(expense.id);
      setPreview(null);
      setDistributionResult(null);
      await loadExpenses();
    } catch (err) {
      setExpenseError(err.message || 'Failed to delete expense.');
    }
  };

  const handleDistribute = async () => {
    if (!preview?.can_distribute || distributing) return;
    const confirmed = window.confirm(
      `Record ${formatAmount(preview.distributable_profit)} in profit payouts for ${startDate} to ${endDate}?`
    );
    if (!confirmed) return;

    setDistributing(true);
    setPageError(null);
    try {
      const result = await distributeProfit(periodPayload());
      setDistributionResult(result);
      setPreview(result);
    } catch (err) {
      setPageError(err.message || 'Failed to distribute profit.');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="page-container admin-container">
      <div className="admin-header-row">
        <div className="admin-header-title">
          <h2>💸 Expenses &amp; Profit Distribution</h2>
          <p>Track restaurant expenses and allocate period profit using investor ownership shares</p>
        </div>
      </div>

      {pageError && <div className="billing-alert billing-alert-error" role="alert">⚠️ {pageError}</div>}

      <section className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Distribution Period</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Estimated Profit = Net Revenue (sales) − Total Expenses
            </p>
          </div>
        </div>
        <div className="admin-filter-toolbar">
          <label className="form-group">
            <span>From date</span>
            <input
              type="date"
              className="form-input"
              value={startDate}
              max={endDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPreview(null);
                setDistributionResult(null);
              }}
              required
            />
          </label>
          <label className="form-group">
            <span>To date</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              min={startDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPreview(null);
                setDistributionResult(null);
              }}
              required
            />
          </label>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handlePreview}
            disabled={!startDate || !endDate || loadingPreview}
          >
            {loadingPreview ? 'Calculating...' : 'Calculate Profit Shares'}
          </button>
        </div>

        {preview && (
          <div style={{ marginTop: '1.25rem' }}>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-title">Net Revenue</span>
                <span className="stat-value">{formatAmount(preview.net_revenue)}</span>
                <span className="stat-hint">Sales in selected period</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Total Expenses</span>
                <span className="stat-value">{formatAmount(preview.total_expenses)}</span>
                <span className="stat-hint">Recorded expenses in selected period</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Estimated Profit</span>
                <span className="stat-value" style={{ color: preview.estimated_profit > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {formatAmount(preview.estimated_profit)}
                </span>
                <span className="stat-hint">Net revenue minus expenses</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Distributable Profit</span>
                <span className="stat-value">{formatAmount(preview.distributable_profit)}</span>
                <span className="stat-hint">Positive estimated profit available to share</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Total Investment</span>
                <span className="stat-value">{formatAmount(preview.total_investment)}</span>
                <span className="stat-hint">Basis for ownership percentages</span>
              </div>
            </div>

            <h3 className="section-title" style={{ margin: '1.25rem 0 0.75rem' }}>
              Investor Profit Shares
            </h3>
            {preview.investors.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>
                No investor investments are recorded for ownership allocation.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Investor</th>
                    <th>Investment</th>
                    <th>Ownership / Profit Share</th>
                    <th>Investor Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.investors.map((investor) => (
                    <tr key={investor.investor_id}>
                      <td><strong>{investor.investor_name}</strong></td>
                      <td>{formatAmount(investor.investor_investment)}</td>
                      <td>{investor.ownership_percent.toFixed(4)}%</td>
                      <td><strong>{formatAmount(investor.investor_profit)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {distributionResult ? (
              <div className="billing-alert" style={{ marginTop: '1rem' }} role="status">
                Profit distribution #{distributionResult.distribution_id} recorded successfully.
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary-action"
                style={{ marginTop: '1rem' }}
                disabled={!preview.can_distribute || distributing}
                onClick={handleDistribute}
              >
                {distributing ? 'Recording payouts...' : `Distribute ${formatAmount(preview.distributable_profit)}`}
              </button>
            )}
            {!preview.can_distribute && !distributionResult && (
              <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                A positive profit and at least one recorded investment are required to distribute money.
              </p>
            )}
          </div>
        )}
      </section>

      <div className="admin-activity-grid">
        <section className="card-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Record an Expense</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Expenses reduce estimated profit for their recorded date.
              </p>
            </div>
          </div>
          <form onSubmit={handleCreateExpense} className="expense-form">
            <label className="form-group">
              <span>Description</span>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength="500"
                required
              />
            </label>
            <label className="form-group">
              <span>Amount (₹)</span>
              <input
                type="number"
                className="form-input"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </label>
            <label className="form-group">
              <span>Expense date</span>
              <input
                type="date"
                className="form-input"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn-primary-action" disabled={savingExpense}>
              {savingExpense ? 'Saving...' : 'Add Expense'}
            </button>
          </form>
          {expenseError && <div className="billing-alert billing-alert-error" role="alert">⚠️ {expenseError}</div>}
        </section>

        <section className="card-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Expenses in Selected Period</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {startDate} to {endDate}
              </p>
            </div>
          </div>
          {loadingExpenses ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No expenses recorded for this period.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString('en-IN')}</td>
                    <td>{expense.description}</td>
                    <td>{formatAmount(expense.amount)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-view-order"
                        aria-label={`Delete expense ${expense.description}`}
                        onClick={() => handleDeleteExpense(expense)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
