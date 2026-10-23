import { authHeaders, handleApiResponse } from '../shared/utils/apiHelper';

const AUTH_BASE_URL = '/api/auth';

export async function loginApi(email, password) {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return handleApiResponse(response);
}

export async function getMeApi() {
  const response = await fetch(`${AUTH_BASE_URL}/me`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function logoutApi() {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleApiResponse(response);
  } catch {
    return { message: 'Logged out' };
  }
}
