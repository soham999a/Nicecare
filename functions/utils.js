import { getAuth } from 'firebase-admin/auth';

/**
 * Verify Firebase ID token from Authorization header.
 * Returns the decoded token or sends a 401 response.
 */
export async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }

  const idToken = authHeader.replace('Bearer ', '');
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error('Auth verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

/**
 * Server-side per-user rate limiter.
 * Tracks request timestamps in memory per uid.
 */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;
const userRequestCounts = new Map();

export function checkRateLimit(uid) {
  const now = Date.now();

  if (!userRequestCounts.has(uid)) {
    userRequestCounts.set(uid, []);
  }

  // Remove old timestamps
  const timestamps = userRequestCounts.get(uid).filter(t => t > now - RATE_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT) {
    const waitTime = Math.ceil((timestamps[0] + RATE_WINDOW_MS - now) / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
  }

  timestamps.push(now);
  userRequestCounts.set(uid, timestamps);
}

/**
 * Set SSE headers and return a helper to write SSE events.
 */
export function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

  return {
    sendChunk(data) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    sendDone(data = {}) {
      res.write(`data: ${JSON.stringify({ ...data, done: true })}\n\n`);
      res.end();
    },
    sendError(message, statusCode = 500) {
      // If headers already sent (SSE started), send error as an event
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
        res.end();
      } else {
        res.status(statusCode).json({ error: message });
      }
    }
  };
}
