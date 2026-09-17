import type { ApiResponse } from '@cms/types';

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  
  const headers: HeadersInit = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Send cookies
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: 'INVALID_JSON',
      message: 'Server returned an invalid JSON response'
    }
  }));

  if (!response.ok || !json.success) {
    const errorDetail = !json.success ? json.error : { code: 'HTTP_ERROR', message: `HTTP ${response.status}` };
    throw new ApiError(errorDetail.message || 'Request failed', errorDetail.code, errorDetail.details);
  }

  return json.data;
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined
    }),
  put: <T>(url: string, data: unknown) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
  delete: <T>(url: string) => apiRequest<T>(url, { method: 'DELETE' })
};
