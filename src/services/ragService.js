import { fetchSSE } from './sseClient';

/**
 * Ask questions about customer data (server-side RAG with SSE streaming).
 * Now supports streaming via onStream callback.
 */
export async function askAboutCustomers(question, currentUserUid, useSemanticSearch = true, onStream = null) {
  return fetchSSE('askAboutCustomers', { question }, onStream);
}

/**
 * Generate a summary of all customer data (server-side RAG with SSE streaming).
 * Now supports streaming via onStream callback.
 */
export async function generateCustomerSummary(currentUserUid, onStream = null) {
  return fetchSSE('customerSummary', {}, onStream);
}
