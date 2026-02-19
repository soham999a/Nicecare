import { auth } from '../config/firebase';

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL || '';

/**
 * Read an SSE stream from a fetch Response, calling onStream for each chunk.
 * Returns the final metadata sent with the `done: true` event.
 */
async function readSSEStream(response, onStream) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let meta = {};
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE lines
    const lines = buffer.split('\n');
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(line.slice(6));

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.done) {
          // Extract metadata from the done event
          const { done: _, ...rest } = data;
          meta = rest;
          continue;
        }

        if (data.chunk) {
          fullResponse += data.chunk;
          if (onStream) {
            onStream(data.chunk, fullResponse);
          }
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr; // Re-throw non-JSON errors (like our error messages)
        }
        // Skip malformed JSON lines
      }
    }
  }

  return { answer: fullResponse, ...meta };
}

/**
 * Make an authenticated SSE request to a Cloud Function.
 */
async function fetchSSE(endpoint, body, onStream) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error('Not authenticated. Please log in.');
  }

  const response = await fetch(`${FUNCTIONS_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
    const err = await response.json();
    throw new Error(err.error || `Request failed with status ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return readSSEStream(response, onStream);
}

export { fetchSSE };
