import config from './config';
import { getItem } from './storage';

/**
 * Custom fetch wrapper that automatically appends JWT Authorization headers,
 * sets Content-Type to application/json, handles body serialization,
 * and standardizes error responses.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getItem('token');
  
  const headers = {
    ...options.headers
  };
  
  // Inject JWT Bearer Token if it exists in local storage
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();

  // Set default JSON Content-Type and serialize body object for writing methods
  if (['POST', 'PUT', 'PATCH'].includes(method) && !options.bodyIsFormData) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  // Clean the endpoint to prevent double slashes in URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${config.API_BASE_URL}${cleanEndpoint}`;

  const fetchOptions = {
    ...options,
    headers
  };
  
  // Clean custom internal parameters
  delete fetchOptions.bodyIsFormData;

  let res;
  try {
    res = await fetch(url, fetchOptions);
  } catch (err) {
    // Customize browser network connection errors (like server offline) to make them descriptive
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Could not connect to the server.', { cause: err });
    }
    throw err;
  }

  // Error handling
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${res.status}`);
  }

  // No-content response handling
  if (res.status === 204) {
    return;
  }

  return res.json();
};


export const generateExamFromAI = async (promptText) => {
  if (!config.USE_SERVER_API) {
    throw new Error('This service is not available now.');
  }

  return await apiFetch('/ai/generate-exam', {
    method: 'POST',
    body: { promptText }
  });
};
