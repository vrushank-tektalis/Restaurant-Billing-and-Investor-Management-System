import { authHeaders, handleApiResponse } from '../../shared/utils/apiHelper';

const BASE_URL = '/api/admin';

// Dashboard
export async function fetchAdminDashboard() {
  const response = await fetch(`${BASE_URL}/dashboard`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

// Investors
export async function fetchAdminInvestors() {
  const response = await fetch(`${BASE_URL}/investors`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function createAdminInvestor(data) {
  const response = await fetch(`${BASE_URL}/investors`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

export async function updateAdminInvestor(id, data) {
  const response = await fetch(`${BASE_URL}/investors/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Investments
export async function fetchAdminInvestments() {
  const response = await fetch(`${BASE_URL}/investments`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function createAdminInvestment(data) {
  const response = await fetch(`${BASE_URL}/investments`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

export async function updateAdminInvestment(id, data) {
  const response = await fetch(`${BASE_URL}/investments/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

export async function createAdminTransaction(investmentId, data) {
  const response = await fetch(`${BASE_URL}/investments/${investmentId}/transactions`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Menu Items
export async function fetchAdminMenu() {
  const response = await fetch(`${BASE_URL}/menu`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function createAdminMenuItem(data) {
  const response = await fetch(`${BASE_URL}/menu`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

export async function updateAdminMenuItem(id, data) {
  const response = await fetch(`${BASE_URL}/menu/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Reports
export async function fetchSalesReport(startDate = '', endDate = '') {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const query = params.toString() ? `?${params.toString()}` : '';

  const response = await fetch(`${BASE_URL}/reports/sales${query}`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function fetchInvestmentReport() {
  const response = await fetch(`${BASE_URL}/reports/investments`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

// User accounts
export async function createAdminUser(data) {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}
