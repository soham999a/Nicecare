import { fetchSSE } from './sseClient';

/**
 * Ask questions about inventory data (server-side RAG with SSE streaming).
 */
export async function askAboutInventory(question, ownerUid, userRole, assignedStoreId = null, ownerUidForMember = null, onStream = null) {
  return fetchSSE('askAboutInventory', {
    question,
    userRole,
    assignedStoreId,
    ownerUidForMember,
  }, onStream);
}

/**
 * Generate inventory summary (server-side RAG with SSE streaming).
 */
export async function generateInventorySummary(ownerUid, userRole, assignedStoreId = null, ownerUidForMember = null, onStream = null) {
  return fetchSSE('inventorySummary', {
    userRole,
    assignedStoreId,
    ownerUidForMember,
  }, onStream);
}

/**
 * Analyze low stock items (server-side RAG with SSE streaming).
 */
export async function analyzeLowStock(ownerUid, userRole, assignedStoreId = null, ownerUidForMember = null, onStream = null) {
  return fetchSSE('inventoryLowStock', {
    userRole,
    assignedStoreId,
    ownerUidForMember,
  }, onStream);
}
