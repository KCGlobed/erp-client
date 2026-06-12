import { useAuthStore } from '../store/useAuthStore';

const BASE_URL =location.host.includes('localhost')?'http://localhost:3000/api/v1':'https://erp-server-932479078084.europe-west1.run.app/api/v1';
// const BASE_URL='https://erp-server-932479078084.europe-west1.run.app/api/v1'

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
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

  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }

        const data = await refreshResponse.json();
        const base64Url = data.accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        useAuthStore.getState().setAuth(data.accessToken, data.refreshToken, {
          id: payload.sub,
          email: payload.email,
          roles: payload.roles,
          permissions: payload.permissions,
          firstName: useAuthStore.getState().user?.firstName || 'User',
          lastName: useAuthStore.getState().user?.lastName || '',
        });

        isRefreshing = false;
        onRefreshed(data.accessToken);
      } catch (err) {
        isRefreshing = false;
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        throw err;
      }
    }

    const newToken = await new Promise<string>((resolve) => {
      addRefreshSubscriber((token) => resolve(token));
    });

    headers.set('Authorization', `Bearer ${newToken}`);
    const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!retryResponse.ok) {
      const errorData = await retryResponse.json().catch(() => null);
      throw new Error(errorData?.message || retryResponse.statusText || 'An error occurred');
    }

    const text = await retryResponse.text();
    return text ? JSON.parse(text) : {};
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || response.statusText || 'An error occurred');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
