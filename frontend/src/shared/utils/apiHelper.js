const TOKEN_KEY = 'restaurant_auth_token';
const USER_KEY = 'restaurant_auth_user';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to save token to localStorage:', err);
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove token from localStorage:', err);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
}

export function removeStoredUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to remove user from localStorage:', err);
  }
}

export function authHeaders(customHeaders = {}) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function handleApiResponse(response) {
  if (!response.ok) {
    let errorMsg = `Request failed (${response.status}: ${response.statusText})`;
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || data.error || errorMsg;
    } catch {
      // response is not JSON
    }
    throw new Error(errorMsg);
  }
  return response.json();
}
