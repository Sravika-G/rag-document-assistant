const API_BASE = '/api';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
  };

  if (headers['Content-Type'] === undefined) {
    // Let browser set boundary for multipart
    const { 'Content-Type': _, ...rest } = headers as any;
    options.headers = rest;
  } else {
    options.headers = headers as any;
  }

  const response = await fetch(`${API_BASE}${url}`, options);
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return response;
}
