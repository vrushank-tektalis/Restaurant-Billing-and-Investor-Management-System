import { authHeaders, handleApiResponse } from '../../shared/utils/apiHelper';

const BASE_URL = '/api/billing';

/**
 * Fetch menu items with optional search query.
 * @param {string} search
 * @returns {Promise<Array>}
 */
export async function fetchMenuItems(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await fetch(`${BASE_URL}/menu${query}`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

/**
 * Create a new billing order.
 * @param {Object} orderData
 * @returns {Promise<Object>}
 */
export async function createOrder(orderData) {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(orderData),
  });
  return handleApiResponse(response);
}

/**
 * Fetch all billing orders.
 * @returns {Promise<Array>}
 */
export async function fetchOrders() {
  const response = await fetch(`${BASE_URL}/orders`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

/**
 * Fetch a specific order by ID.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function fetchOrderById(id) {
  const response = await fetch(`${BASE_URL}/orders/${id}`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}
