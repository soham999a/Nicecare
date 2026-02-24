import { getAuthToken } from './httpClient';
import { getFunctionsUrl } from './config';

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
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.done) {
          const { done: _done, ...rest } = data;
          meta = rest;
          continue;
        }
        if (data.chunk) {
          fullResponse += data.chunk;
          if (onStream) onStream(data.chunk, fullResponse);
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
  }

  return { answer: fullResponse, ...meta };
}

export async function postSSE(endpoint, body, onStream) {
  const idToken = await getAuthToken();
  const functionsUrl = getFunctionsUrl();

  const response = await fetch(`${functionsUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
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
