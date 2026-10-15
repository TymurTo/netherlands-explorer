import { parseApiError } from './validation.js';
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Atlas-Request': '1',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const { message, fieldErrors } = parseApiError(data.detail);
    const error = new Error(message);
    error.fieldErrors = fieldErrors;
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
