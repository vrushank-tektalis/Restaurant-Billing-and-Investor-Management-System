import { authHeaders, handleApiResponse } from '../../shared/utils/apiHelper';

const BASE_URL = '/api/investor';

export async function fetchInvestorProfile() {
  const response = await fetch(`${BASE_URL}/profile`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function fetchInvestorInvestments() {
  const response = await fetch(`${BASE_URL}/investments`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}

export async function fetchInvestorSummary() {
  const response = await fetch(`${BASE_URL}/summary`, {
    headers: authHeaders(),
  });
  return handleApiResponse(response);
}
