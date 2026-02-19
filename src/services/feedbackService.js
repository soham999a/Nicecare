import { auth } from '../config/firebase';

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL || '';

/**
 * Submit feedback (thumbs up/down + optional comment) for a chatbot response.
 *
 * @param {Object} data
 * @param {string} data.messageId   - Unique ID for this message
 * @param {string} data.question    - The user's question that triggered this response
 * @param {string} data.answer      - The AI's response text
 * @param {'up'|'down'} data.rating - Thumbs up or down
 * @param {string} [data.comment]   - Optional free-text comment
 * @param {'crm'|'inventory'} data.module - Which chatbot module
 * @returns {Promise<{success: boolean}>}
 */
export async function submitFeedback({ messageId, question, answer, rating, comment, module }) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error('Not authenticated. Please log in.');
  }

  const response = await fetch(`${FUNCTIONS_URL}/submitFeedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ messageId, question, answer, rating, comment, module }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to submit feedback' }));
    throw new Error(err.error);
  }

  return response.json();
}
