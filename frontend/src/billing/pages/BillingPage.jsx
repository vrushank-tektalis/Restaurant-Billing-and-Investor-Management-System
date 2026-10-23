import React, { useState, useEffect } from 'react';
import MenuCard from '../components/MenuCard';
import CartItem from '../components/CartItem';
import ReceiptModal from '../components/ReceiptModal';
import { fetchMenuItems, createOrder } from '../services/billingApi';
import { calcSubtotal, calcTaxAmount, calcTotal, calcLineTotal } from '../utils/billCalculator';
import './BillingPage.css';

export default function BillingPage() {
  // Menu State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);

  // Bill Summary State
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5); // Default 5% GST
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch menu on mount and when debouncedSearch changes
  useEffect(() => {
    let isCancelled = false;

    async function loadMenu() {
      setLoadingMenu(true);
      setMenuError(null);
      try {
        const data = await fetchMenuItems(debouncedSearch);
        if (!isCancelled) {
          // Normalize items array if data is an array or { items: [...] }
          const items = Array.isArray(data) ? data : data?.items || [];
          setMenuItems(items);
        }
      } catch (err) {
        if (!isCancelled) {
          setMenuError(err.message || 'Failed to load menu items.');
        }
      } finally {
        if (!isCancelled) {
          setLoadingMenu(false);
        }
      }
    }

    loadMenu();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  // Cart Actions
  const handleAddToCart = (item) => {
    const stock = Number(item.quantity || 0);
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        if (existing.quantity >= stock) return prevCart;
        return prevCart.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1, maxQuantity: stock } : ci
        );
      }
      if (stock <= 0) return prevCart;
      return [
        ...prevCart,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          maxQuantity: stock,
          category: item.category,
        },
      ];
    });
  };

  const handleIncrement = (id) => {
    setCart((prevCart) =>
      prevCart.map((ci) =>
        ci.id === id && ci.quantity < ci.maxQuantity
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      )
    );
  };

  const handleDecrement = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.id === id) {
            return { ...ci, quantity: ci.quantity - 1 };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0)
    );
  };

  const handleRemove = (id) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.id !== id));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the current order?')) {
      setCart([]);
    }
  };

  // Calculations
  const subtotal = calcSubtotal(cart);
  const taxAmount = calcTaxAmount(subtotal, taxPercent);
  const total = calcTotal(subtotal, discount, taxAmount);

  // Group menu items by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Generate Bill Order
  const handleGenerateBill = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    setOrderError(null);

    const orderPayload = {
      items: cart.map((item) => ({
        menu_item_id: item.id,
        item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: calcLineTotal(item.quantity, item.price),
      })),
      subtotal: subtotal,
      discount: Number(discount) || 0,
      tax_percent: Number(taxPercent) || 0,
      tax_amount: taxAmount,
      total_amount: total,
      payment_method: paymentMethod,
    };

    try {
      const created = await createOrder(orderPayload);
      
      // Ensure the receipt modal has all required fields to display
      const finalOrder = {
        id: created?.id || created?.bill_no || 'ORD-' + Date.now().toString().slice(-6),
        bill_no: created?.bill_no || created?.bill_number || created?.id || 'ORD-' + Date.now().toString().slice(-6),
        order_date: created?.order_date || created?.created_at || new Date().toISOString(),
        items: created?.items || orderPayload.items,
        subtotal: created?.subtotal ?? orderPayload.subtotal,
        discount: created?.discount ?? orderPayload.discount,
        tax_amount: created?.tax_amount ?? orderPayload.tax_amount,
        tax_percent: created?.tax_percent ?? orderPayload.tax_percent,
        total_amount: created?.total_amount ?? orderPayload.total_amount,
        payment_method: created?.payment_method ?? orderPayload.payment_method,
      };

      setCompletedOrder(finalOrder);
      setMenuItems((previousItems) => previousItems
        .map((menuItem) => {
          const orderedItem = cart.find((item) => item.id === menuItem.id);
          return orderedItem
            ? { ...menuItem, quantity: Math.max(0, Number(menuItem.quantity) - orderedItem.quantity) }
            : menuItem;
        })
        .filter((menuItem) => Number(menuItem.quantity) > 0));
      // Reset form
      setCart([]);
      setDiscount(0);
    } catch (err) {
      setOrderError(err.message || 'Failed to generate bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {orderError && (
        <div className="billing-alert billing-alert-error" role="alert">
          <span>⚠️ {orderError}</span>
          <button
            type="button"
            className="billing-alert-close"
            onClick={() => setOrderError(null)}
          >
            &times;
          </button>
        </div>
      )}

      <div className="billing-layout">
        {/* ================= LEFT PANEL: MENU ================= */}
        <section className="billing-panel menu-panel">
          <div className="panel-header">
            <h2 className="panel-title">📋 Menu Items</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {menuItems.length} items
            </span>
          </div>

          <div className="menu-search-box">
            <input
              type="text"
              className="menu-search-input"
              placeholder="🔍 Search items by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="menu-categories-container">
            {loadingMenu ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                Loading menu items...
              </div>
            ) : menuError ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-danger-text)' }}>
                <p>⚠️ {menuError}</p>
                <button
                  type="button"
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.4rem 0.8rem',
                    background: 'var(--color-border)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setDebouncedSearch((s) => (s === '' ? ' ' : ''))}
                >
                  Retry
                </button>
              </div>
            ) : Object.keys(groupedMenu).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                No items found.
              </div>
            ) : (
              Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className="category-group">
                  <h3 className="category-title">{category}</h3>
                  <div className="menu-items-grid">
                    {items.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        onAdd={handleAddToCart}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ================= CENTER PANEL: CART ================= */}
        <section className="billing-panel cart-panel">
          <div className="panel-header">
            <h2 className="panel-title">🛒 Current Order</h2>
            {cart.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>

          <div className="cart-items-container">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <span className="cart-empty-icon">🍽️</span>
                <strong>Order is empty</strong>
                <p>Click "+ Add" on menu items to begin billing.</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer-actions">
              <button
                type="button"
                className="btn-clear-cart"
                onClick={handleClearCart}
              >
                Clear All
              </button>
            </div>
          )}
        </section>

        {/* ================= RIGHT PANEL: BILL SUMMARY ================= */}
        <section className="billing-panel summary-panel">
          <div className="panel-header">
            <h2 className="panel-title">💳 Bill Summary</h2>
          </div>

          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>

            <div className="summary-row">
              <label htmlFor="discount-input">Discount (₹):</label>
              <div className="summary-row-input">
                <span>₹</span>
                <input
                  id="discount-input"
                  type="number"
                  min="0"
                  step="any"
                  className="summary-input"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="summary-row">
              <label htmlFor="tax-input">Tax Rate (%):</label>
              <div className="summary-row-input">
                <input
                  id="tax-input"
                  type="number"
                  min="0"
                  step="any"
                  className="summary-input"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                />
                <span>%</span>
              </div>
            </div>

            <div className="summary-row">
              <span>Tax Amount:</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span>Grand Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-section">
            <span className="payment-label">Payment Method:</span>
            <div className="payment-options">
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === 'Cash' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                💵 Cash
              </button>
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('UPI')}
              >
                📱 UPI
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn-generate-bill"
            disabled={cart.length === 0 || submitting}
            onClick={handleGenerateBill}
          >
            {submitting ? (
              <>
                <span className="spinner"></span> Generating...
              </>
            ) : (
              '🧾 Generate Bill'
            )}
          </button>
        </section>
      </div>

      {/* Receipt Modal on Successful Order */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
