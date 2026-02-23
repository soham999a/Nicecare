import { postSSE } from '../client/sseClient';

export async function askAboutCustomers(
  question,
  _currentUserUid,
  // eslint-disable-next-line no-unused-vars -- kept for backward compatibility with callers
  useSemanticSearch = true,
  onStream = null
) {
  return postSSE('askAboutCustomers', { question }, onStream);
}

export async function generateCustomerSummary(_currentUserUid, onStream = null) {
  return postSSE('customerSummary', {}, onStream);
}
