import { useAuthStore } from '../store/useAuthStore';

// const BASE_URL =location.host.includes('localhost')?'http://localhost:3000/api/v1':'https://erp-server-932479078084.europe-west1.run.app/api/v1';
const BASE_URL='https://erp-server-932479078084.europe-west1.run.app/api/v1'

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().accessToken;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Basic logout on 401. In a real app with refresh tokens, we would attempt a refresh here.
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || response.statusText || 'An error occurred');
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
