import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useAuth } from './auth/AuthContext';
import Login from './auth/Login';

// Billing Module
import BillingPage from './billing/pages/BillingPage';
import HistoryPage from './billing/pages/HistoryPage';

// Investor Module
import InvestorDashboard from './investor/pages/InvestorDashboard';
import InvestmentDetails from './investor/pages/InvestmentDetails';
import InvestmentHistory from './investor/pages/InvestmentHistory';

// Admin Module
import AdminDashboard from './admin/pages/AdminDashboard';
import MenuManagement from './admin/pages/MenuManagement';
import InvestorManagement from './admin/pages/InvestorManagement';
import InvestmentManagement from './admin/pages/InvestmentManagement';
import ProfitDistribution from './admin/pages/ProfitDistribution';

const Reports = lazy(() => import('./admin/pages/Reports'));

import './App.css';

export default function App() {
  const { user, role, isAuthenticated, loading, logout } = useAuth();
  const displayRole = role === 'ADMIN' ? 'Restaurant Owner' : role;
  const [currentView, setCurrentView] = useState('dashboard');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Set default view depending on role upon login
  useEffect(() => {
    if (role === 'ADMIN') {
      setCurrentView('admin_dashboard');
    } else if (role === 'CASHIER') {
      setCurrentView('billing');
    } else if (role === 'INVESTOR') {
      setCurrentView('investor_dashboard');
    }
  }, [role]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [accountOpen]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 1rem' }}></div>
          <p>Initializing Restaurant System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-root">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="brand-title">
            <span>🍽️</span>
            <span>Restaurant Management</span>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              backgroundColor:
                role === 'ADMIN'
                  ? 'var(--color-tint-1)'
                  : role === 'CASHIER'
                  ? 'var(--color-tint-4)'
                  : 'var(--color-tint-2)',
              color: 'var(--color-text)',
            }}
          >
            {displayRole}
          </span>
        </div>

        {/* Role-Specific Nav Buttons */}
        <nav className="nav-buttons">
          {/* ADMIN NAVIGATION */}
          {role === 'ADMIN' && (
            <>
              <button
                type="button"
                className={`nav-btn ${currentView === 'admin_dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin_dashboard')}
              >
                📊 Overview
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'menu' ? 'active' : ''}`}
                onClick={() => setCurrentView('menu')}
              >
                📋 Menu
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'investors' ? 'active' : ''}`}
                onClick={() => setCurrentView('investors')}
              >
                👥 Investors
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'investments' ? 'active' : ''}`}
                onClick={() => setCurrentView('investments')}
              >
                💼 Investments
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'profit_distribution' ? 'active' : ''}`}
                onClick={() => setCurrentView('profit_distribution')}
              >
                💸 Expenses &amp; Distributions
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'reports' ? 'active' : ''}`}
                onClick={() => setCurrentView('reports')}
              >
                📈 Reports
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'billing' ? 'active' : ''}`}
                onClick={() => setCurrentView('billing')}
              >
                🧾 Cashier POS
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'billing_history' ? 'active' : ''}`}
                onClick={() => setCurrentView('billing_history')}
              >
                📜 Sales History
              </button>
            </>
          )}

          {/* CASHIER NAVIGATION */}
          {role === 'CASHIER' && (
            <>
              <button
                type="button"
                className={`nav-btn ${currentView === 'billing' ? 'active' : ''}`}
                onClick={() => setCurrentView('billing')}
              >
                🧾 New Bill
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'billing_history' ? 'active' : ''}`}
                onClick={() => setCurrentView('billing_history')}
              >
                📜 Billing History
              </button>
            </>
          )}

          {/* INVESTOR NAVIGATION */}
          {role === 'INVESTOR' && (
            <>
              <button
                type="button"
                className={`nav-btn ${currentView === 'investor_dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('investor_dashboard')}
              >
                📊 Dashboard
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'investment_details' ? 'active' : ''}`}
                onClick={() => setCurrentView('investment_details')}
              >
                🔍 Investment Details
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'investment_history' ? 'active' : ''}`}
                onClick={() => setCurrentView('investment_history')}
              >
                📜 History
              </button>
            </>
          )}
        </nav>

        <div className="account-area" ref={accountMenuRef}>
          <button
            type="button"
            className="account-trigger"
            aria-label="Open account menu"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            onClick={() => setAccountOpen((open) => !open)}
          >
            <span aria-hidden="true">👤</span>
          </button>
          {accountOpen && (
            <div className="account-popover" role="menu">
              <div className="account-summary">
                <strong>{user?.name || 'Account'}</strong>
                <span>{user?.email}</span>
                <span className="account-role">{displayRole}</span>
              </div>
              <button
                type="button"
                className="account-logout"
                role="menuitem"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {/* Admin Views */}
        {role === 'ADMIN' && currentView === 'admin_dashboard' && (
          <AdminDashboard
            onNavigate={(view) => {
              if (view === 'billing') setCurrentView('billing');
              else if (view === 'history') setCurrentView('billing_history');
              else if (view === 'menu') setCurrentView('menu');
              else if (view === 'investors') setCurrentView('investors');
              else if (view === 'investments') setCurrentView('investments');
              else if (view === 'reports') setCurrentView('reports');
            }}
          />
        )}
        {role === 'ADMIN' && currentView === 'menu' && <MenuManagement />}
        {role === 'ADMIN' && currentView === 'investors' && <InvestorManagement />}
        {role === 'ADMIN' && currentView === 'investments' && <InvestmentManagement />}
        {role === 'ADMIN' && currentView === 'profit_distribution' && <ProfitDistribution />}
        {role === 'ADMIN' && currentView === 'reports' && (
          <Suspense fallback={<div className="page-container">Loading reports...</div>}>
            <Reports />
          </Suspense>
        )}

        {/* Cashier & Billing Views */}
        {(role === 'CASHIER' || role === 'ADMIN') && currentView === 'billing' && (
          <BillingPage />
        )}
        {(role === 'CASHIER' || role === 'ADMIN') && currentView === 'billing_history' && (
          <HistoryPage onNavigate={() => setCurrentView('billing')} />
        )}

        {/* Investor Views */}
        {role === 'INVESTOR' && currentView === 'investor_dashboard' && (
          <InvestorDashboard onNavigate={(v) => setCurrentView('investment_' + v)} />
        )}
        {role === 'INVESTOR' && currentView === 'investment_details' && (
          <InvestmentDetails />
        )}
        {role === 'INVESTOR' && currentView === 'investment_history' && (
          <InvestmentHistory />
        )}
      </main>
    </div>
  );
}
