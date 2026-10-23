import React from 'react';

/**
 * MenuCard Component
 * Displays a single menu item with name, category, price in ₹, and Add button.
 */
export default function MenuCard({ item, onAdd }) {
  if (!item) return null;

  const price = Number(item.price || 0).toFixed(2);

  return (
    <div className="menu-card">
      <div className="menu-card-top">
        <h4 className="menu-card-name">{item.name}</h4>
        {item.category && (
          <span className="menu-card-category-badge">{item.category}</span>
        )}
      </div>
      
      {item.description && (
        <p className="menu-card-description">{item.description}</p>
      )}

      <p className="menu-card-stock">{Number(item.quantity || 0)} in stock</p>

      <div className="menu-card-bottom">
        <div className="menu-card-price">
          <span className="currency-symbol">₹</span>
          <span>{price}</span>
        </div>
        <button
          type="button"
          className="btn-add-menu-item"
          disabled={Number(item.quantity || 0) <= 0}
          onClick={() => onAdd(item)}
          aria-label={`Add ${item.name} to order`}
        >
          {Number(item.quantity || 0) <= 0 ? 'Out of stock' : '+ Add'}
        </button>
      </div>
    </div>
  );
}
