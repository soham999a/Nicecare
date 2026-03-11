import { auth } from '../../config/firebase';
import { assertBackendConfig, getFunctionsUrl } from './config';

assertBackendConfig();

function buildError(message, status = 500, details = null) {
  const error = new Error(message || 'Request failed');
  error.status = status;
  error.details = details;
  return error;
}

export function normalizeApiError(err, fallbackMessage = 'Unexpected API error') {
  return {
    message: err?.message || fallbackMessage,
    status: err?.status || 500,
    details: err?.details || null,
  };
}

export async function getAuthToken() {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw buildError('Not authenticated. Please log in.', 401);
  }
  return idToken;
}

export async function postJson(endpoint, body = {}) {
  const token = await getAuthToken();
  const functionsUrl = getFunctionsUrl();
  if (!functionsUrl) {
    throw buildError(
      'Backend URL is not configured. Set VITE_FUNCTIONS_URL in your environment.',
      500
    );
  }
  const response = await fetch(`${functionsUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw buildError(
        `Endpoint not found (${endpoint}). Restart local backend or deploy updated Cloud Functions.`,
        404,
        details
      );
    }
    throw buildError(
      details?.error || `Request failed with status ${response.status}`,
      response.status,
      details
    );
  }

  return response.json();
}
