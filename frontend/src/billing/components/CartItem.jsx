import React from 'react';
import { calcLineTotal } from '../utils/billCalculator';

/**
 * CartItem Component
 * Renders a single row in the cart panel with controls for quantity and deletion.
 */
export default function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  if (!item) return null;

  const lineTotal = calcLineTotal(item.quantity, item.price);
  const unitPrice = Number(item.price || 0).toFixed(2);

  return (
    <div className="cart-item-row">
      <div className="cart-item-details">
        <div className="cart-item-title">{item.name}</div>
        <div className="cart-item-unit-price">₹{unitPrice} each</div>
      </div>

      <div className="cart-item-quantity-controls">
        <button
          type="button"
          className="qty-btn"
          onClick={() => onDecrement(item.id)}
          aria-label={`Decrease quantity of ${item.name}`}
        >
          -
        </button>
        <span className="qty-number">{item.quantity}</span>
        <button
          type="button"
          className="qty-btn"
          disabled={item.quantity >= item.maxQuantity}
          onClick={() => onIncrement(item.id)}
          aria-label={`Increase quantity of ${item.name}`}
        >
          +
        </button>
      </div>

      <div className="cart-item-line-total">
        ₹{lineTotal.toFixed(2)}
      </div>

      <button
        type="button"
        className="cart-item-remove-btn"
        onClick={() => onRemove(item.id)}
        title="Remove item"
        aria-label={`Remove ${item.name}`}
      >
        &times;
      </button>
    </div>
  );
}
