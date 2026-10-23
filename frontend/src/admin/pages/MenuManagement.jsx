import React, { useState, useEffect } from 'react';
import { fetchAdminMenu, createAdminMenuItem, updateAdminMenuItem } from '../services/adminApi';
import '../admin.css';

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('name-asc');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: 0,
    is_available: true,
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMenu();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const categories = ['ALL', ...new Set(items.map((i) => i.category).filter(Boolean))].sort((left, right) =>
    left === 'ALL' ? -1 : right === 'ALL' ? 1 : left.localeCompare(right)
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', price: '', quantity: 0, is_available: true });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity ?? 0,
      is_available: item.is_available,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updated = await updateAdminMenuItem(item.id, {
        is_available: !item.is_available,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      alert(`Failed to update item: ${err.message}`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      is_available: Boolean(formData.is_available),
    };

    try {
      if (editingItem) {
        const updated = await updateAdminMenuItem(editingItem.id, payload);
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      } else {
        const created = await createAdminMenuItem(payload);
        setItems((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err.message || 'Operation failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      !search ||
      String(item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesAvailability =
      availabilityFilter === 'ALL' ||
      (availabilityFilter === 'AVAILABLE' && item.is_available) ||
      (availabilityFilter === 'UNAVAILABLE' && !item.is_available);
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'IN_STOCK' && quantity > 0) ||
      (stockFilter === 'LOW_STOCK' && quantity > 0 && quantity <= 10) ||
      (stockFilter === 'OUT_OF_STOCK' && quantity === 0);
    const matchesPrice =
      priceFilter === 'ALL' ||
      (priceFilter === 'UNDER_100' && price < 100) ||
      (priceFilter === '100_TO_250' && price >= 100 && price <= 250) ||
      (priceFilter === 'OVER_250' && price > 250);
    return matchesCat && matchesSearch && matchesAvailability && matchesStock && matchesPrice;
  }).sort((left, right) => {
    const [sortKey, direction] = sortOption.split('-');
    const leftValue = sortKey === 'name' || sortKey === 'category'
      ? String(left[sortKey] || '').toLocaleLowerCase()
      : Number(left[sortKey] || 0);
    const rightValue = sortKey === 'name' || sortKey === 'category'
      ? String(right[sortKey] || '').toLocaleLowerCase()
      : Number(right[sortKey] || 0);
    const comparison = typeof leftValue === 'string'
      ? leftValue.localeCompare(rightValue)
      : leftValue - rightValue;
    return direction === 'desc' ? -comparison : comparison;
  });

  return (
    <div className="page-container admin-container">
      <div className="admin-header-row">
        <div className="admin-header-title">
          <h2>📋 Menu Management</h2>
          <p>Add new dishes, update pricing, and toggle item availability</p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={handleOpenAdd}
        >
          ➕ Add Menu Item
        </button>
      </div>

      {error && <div className="billing-alert billing-alert-error">⚠️ {error}</div>}

      {/* Filter toolbar */}
      <div className="menu-filter-toolbar">
        <input
          type="text"
          className="menu-search-input"
          aria-label="Search menu items"
          placeholder="🔍 Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter by category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {categories.map((category) => <option key={category} value={category}>{category === 'ALL' ? 'All categories' : category}</option>)}
        </select>
        <select aria-label="Filter by availability" value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
          <option value="ALL">All availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>
        <select aria-label="Filter by stock" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="ALL">All stock levels</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock (10 or less)</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
        <select aria-label="Filter by price" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
          <option value="ALL">All prices</option>
          <option value="UNDER_100">Under ₹100</option>
          <option value="100_TO_250">₹100 to ₹250</option>
          <option value="OVER_250">Over ₹250</option>
        </select>
        <select aria-label="Sort menu items" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="name-asc">Name A to Z</option>
          <option value="name-desc">Name Z to A</option>
          <option value="category-asc">Category A to Z</option>
          <option value="price-asc">Price low to high</option>
          <option value="price-desc">Price high to low</option>
          <option value="quantity-asc">Stock low to high</option>
          <option value="quantity-desc">Stock high to low</option>
        </select>
      </div>

      <div className="card-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ width: 28, height: 28 }}></div>
            <p style={{ marginTop: '0.75rem' }}>Loading menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No menu items found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Dish Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Available</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>
                    <span className="menu-card-category-badge">{item.category}</span>
                  </td>
                  <td><strong>₹{Number(item.price).toFixed(2)}</strong></td>
                  <td>{Number(item.quantity ?? 0)}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={item.is_available}
                        onChange={() => handleToggleAvailability(item)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-view-order"
                      onClick={() => handleOpenEdit(item)}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingItem ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="billing-alert billing-alert-error" style={{ margin: 0 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="item-name">Dish Name *</label>
                  <input
                    id="item-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Butter Chicken"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item-category">Category *</label>
                  <input
                    id="item-category"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Main Course, Breakfast, Desserts"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item-price">Price (₹) *</label>
                  <input
                    id="item-price"
                    type="number"
                    min="1"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 150.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item-quantity">Stock quantity *</label>
                  <input
                    id="item-quantity"
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    Available for order in Cashier POS
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-view-order"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
